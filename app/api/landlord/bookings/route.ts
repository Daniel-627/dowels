import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, properties, rentalRequests } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  requestId: z.string().uuid(),
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  startDate: z.string().min(1),
  totalAmount: z.number().positive(),
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

    // Verify property belongs to this landlord
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, parsed.data.propertyId))
      .limit(1);

    if (!property[0] || property[0].landlordId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Create booking
    const booking = await db
      .insert(bookings)
      .values({
        propertyId: parsed.data.propertyId,
        tenantId: parsed.data.tenantId,
        rentalRequestId: parsed.data.requestId,
        startDate: parsed.data.startDate,
        totalAmount: String(parsed.data.totalAmount),
        status: "ACTIVE",
      })
      .returning();

    // Update property status to OCCUPIED
    await db
      .update(properties)
      .set({ status: "OCCUPIED" })
      .where(eq(properties.id, parsed.data.propertyId));

    // Mark rental request as approved
    await db
      .update(rentalRequests)
      .set({ status: "APPROVED" })
      .where(eq(rentalRequests.id, parsed.data.requestId));

    return NextResponse.json({ success: true, data: booking[0] }, { status: 201 });

  } catch (err) {
    console.error("[create booking]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}