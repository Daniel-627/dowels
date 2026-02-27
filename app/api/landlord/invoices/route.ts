import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, bookings, properties } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string().uuid(),
  type: z.enum(["RENT", "UTILITY", "OTHER"]),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
  period: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0].message,
      }, { status: 400 });
    }

    // Verify booking belongs to this landlord
    const booking = await db
      .select({ propertyId: bookings.propertyId })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(bookings.id, parsed.data.bookingId))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const invoice = await db
  .insert(invoices)
  .values({
    bookingId: parsed.data.bookingId,
    type: parsed.data.type,
    amount: String(parsed.data.amount),
    dueDate: parsed.data.dueDate,
    status: "UNPAID",
    ...(parsed.data.period ? { period: parsed.data.period } : {}),
  })
  .returning();

    return NextResponse.json({ success: true, data: invoice[0] }, { status: 201 });

  } catch (err) {
    console.error("[create invoice]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}