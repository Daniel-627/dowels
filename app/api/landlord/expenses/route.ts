import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, properties } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3),
  category: z.enum(["MAINTENANCE", "UTILITIES", "INSURANCE", "OTHER"]),
  amount: z.number().positive(),
  date: z.string().min(1),
  description: z.string().optional(),
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

    const expense = await db
      .insert(expenses)
      .values({
        propertyId: parsed.data.propertyId,
        title: parsed.data.title,
        category: parsed.data.category,
        amount: String(parsed.data.amount),
        date: parsed.data.date,
        ...(parsed.data.description ? { description: parsed.data.description } : {}),
      })
      .returning();

    return NextResponse.json({ success: true, data: expense[0] }, { status: 201 });

  } catch (err) {
    console.error("[log expense]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}