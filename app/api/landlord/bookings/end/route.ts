import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string().uuid(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    // Get booking
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parsed.data.bookingId))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // End the booking
    await db
      .update(bookings)
      .set({
        status: "ENDED",
        endDate: new Date().toISOString().split("T")[0],
      })
      .where(eq(bookings.id, parsed.data.bookingId));

    // Free the property back to AVAILABLE
    await db
      .update(properties)
      .set({ status: "AVAILABLE" })
      .where(eq(properties.id, booking[0].propertyId));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[end booking]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}