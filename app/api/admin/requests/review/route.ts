import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rentalRequests, properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !["ADMIN", "LANDLORD"].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    // Get the request to find the property
    const request = await db
      .select()
      .from(rentalRequests)
      .where(eq(rentalRequests.id, parsed.data.requestId))
      .limit(1);

    if (!request[0]) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    // Update request status
    await db
      .update(rentalRequests)
      .set({
        status: parsed.data.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      })
      .where(eq(rentalRequests.id, parsed.data.requestId));

    // Update property status based on decision
    if (parsed.data.status === "APPROVED") {
      // Lock the property — no more requests
      await db
        .update(properties)
        .set({ status: "OCCUPIED" })
        .where(eq(properties.id, request[0].propertyId));
    } else if (parsed.data.status === "REJECTED") {
      // Free the property back up
      await db
        .update(properties)
        .set({ status: "AVAILABLE" })
        .where(eq(properties.id, request[0].propertyId));
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[review request]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}