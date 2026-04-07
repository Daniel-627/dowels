import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maintenanceRequests, bookings, properties } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    // Verify request belongs to this landlord's property
    const request = await db
      .select({ id: maintenanceRequests.id })
      .from(maintenanceRequests)
      .leftJoin(bookings, eq(maintenanceRequests.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(
        and(
          eq(maintenanceRequests.id, id),
          eq(properties.landlordId, session.user.id)
        )
      )
      .limit(1);

    if (!request[0]) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await db
      .update(maintenanceRequests)
      .set({
        status: parsed.data.status,
        ...(parsed.data.status === "RESOLVED"
          ? { resolvedAt: new Date() }
          : { resolvedAt: null }),
      })
      .where(eq(maintenanceRequests.id, id));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[update maintenance]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}