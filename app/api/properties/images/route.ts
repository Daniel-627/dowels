import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propertyImages } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  propertyId: z.string().uuid(),
  url: z.string().url(),
  caption: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const image = await db
      .insert(propertyImages)
      .values(parsed.data)
      .returning();

    return NextResponse.json({ success: true, data: image[0] }, { status: 201 });

  } catch (err) {
    console.error("[save image]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}