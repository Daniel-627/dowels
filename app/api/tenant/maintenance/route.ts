import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { maintenanceRequests, bookings, properties, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { sendMaintenanceRequestEmail } from "@/lib/email";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Please describe the issue"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
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

    // Get active booking for this tenant
    const booking = await db
      .select({
        id: bookings.id,
        propertyTitle: properties.title,
        landlordName: users.name,
        landlordEmail: users.email,
      })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(users, eq(properties.landlordId, users.id))
      .where(
        and(
          eq(bookings.tenantId, session.user.id),
          eq(bookings.status, "ACTIVE")
        )
      )
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json({
        success: false,
        error: "No active booking found",
      }, { status: 400 });
    }

    const request = await db
      .insert(maintenanceRequests)
      .values({
        bookingId: booking[0].id,
        tenantId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
      })
      .returning();

    // Notify landlord
    if (booking[0].landlordEmail && booking[0].landlordName && booking[0].propertyTitle) {
      await sendMaintenanceRequestEmail({
        to: booking[0].landlordEmail,
        landlordName: booking[0].landlordName,
        tenantName: session.user.name ?? "Tenant",
        propertyTitle: booking[0].propertyTitle,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: request[0] }, { status: 201 });

  } catch (err) {
    console.error("[maintenance request]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}