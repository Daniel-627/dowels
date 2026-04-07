import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0].message,
      }, { status: 400 });
    }

    const { email, code, newPassword } = parsed.data;

    // Find valid unused token
    const token = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.email, email),
          eq(passwordResetTokens.code, code),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (!token[0]) {
      return NextResponse.json({
        success: false,
        error: "Invalid or expired code",
      }, { status: 400 });
    }

    // Check expiry
    if (new Date() > token[0].expiresAt) {
      return NextResponse.json({
        success: false,
        error: "Code has expired. Please request a new one.",
      }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, email));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, token[0].id));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[reset password]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}