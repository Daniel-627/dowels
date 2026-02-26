import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  propertyId: z.string().uuid(),
  isPublished: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    await db
      .update(properties)
      .set({ isPublished: parsed.data.isPublished })
      .where(eq(properties.id, parsed.data.propertyId));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[publish toggle]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}