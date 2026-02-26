import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rentalRequests } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

const schema = z.object({
  propertyId: z.string().uuid(),
  moveInDate: z.string().min(1),
  occupants: z.number().int().positive(),
  employmentInfo: z.string().min(10),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TENANT") {
      return NextResponse.json({
        success: false,
        error: "Only tenants can submit rental requests"
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0].message,
      }, { status: 400 });
    }

    // Check for existing request
    const existing = await db
      .select()
      .from(rentalRequests)
      .where(
        and(
          eq(rentalRequests.propertyId, parsed.data.propertyId),
          eq(rentalRequests.tenantId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: "You have already submitted a request for this property",
      }, { status: 409 });
    }

    const request = await db
      .insert(rentalRequests)
      .values({
        propertyId: parsed.data.propertyId,
        tenantId: session.user.id,
        moveInDate: parsed.data.moveInDate,
        occupants: parsed.data.occupants,
        employmentInfo: parsed.data.employmentInfo,
        message: parsed.data.message ?? null,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ success: true, data: request[0] }, { status: 201 });

  } catch (err) {
    console.error("[rental request]", err);
    return NextResponse.json({
      success: false,
      error: "Something went wrong"
    }, { status: 500 });
  }
}