import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rentalRequests } from "@/lib/db/schema";
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

    await db
      .update(rentalRequests)
      .set({
        status: parsed.data.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      })
      .where(eq(rentalRequests.id, parsed.data.requestId));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[review request]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}