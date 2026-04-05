import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(1, "Password is required"),
});

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role === "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

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

    const valid = await bcrypt.compare(parsed.data.password, user[0].passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete account]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}