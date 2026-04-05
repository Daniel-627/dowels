import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
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

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user[0].passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
    }

    const hash = await bcrypt.hash(parsed.data.newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash: hash })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[update password]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}