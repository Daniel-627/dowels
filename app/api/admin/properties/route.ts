import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { properties } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  location: z.string().min(3),
  rentAmount: z.number().positive(),
  bedrooms: z.number().int().positive(),
  bathrooms: z.number().int().positive(),
  landlordId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
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

    const property = await db
      .insert(properties)
      .values({
        ...parsed.data,
        rentAmount: String(parsed.data.rentAmount),
        status: "AVAILABLE",
        isPublished: false,
      })
      .returning();

    return NextResponse.json({ success: true, data: property[0] }, { status: 201 });

  } catch (err) {
    console.error("[create property]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}