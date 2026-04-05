import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        name: parsed.data.name,
        ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[update profile]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}