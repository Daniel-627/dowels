import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, bookings, properties, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendInvoiceEmail } from "@/lib/email";

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

    // Get booking with tenant and property details
    const booking = await db
      .select({
        propertyId: bookings.propertyId,
        tenantName: users.name,
        tenantEmail: users.email,
        propertyTitle: properties.title,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.tenantId, users.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(bookings.id, parsed.data.bookingId))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    const { tenantName, tenantEmail, propertyTitle } = booking[0];

    // Create invoice
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

    // Send email notification to tenant
    if (tenantEmail && tenantName && propertyTitle) {
      await sendInvoiceEmail({
        to: tenantEmail,
        tenantName,
        propertyTitle,
        invoiceType: parsed.data.type,
        amount: parsed.data.amount,
        dueDate: parsed.data.dueDate,
        period: parsed.data.period,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: invoice[0] }, { status: 201 });

  } catch (err) {
    console.error("[create invoice]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}