import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }

    const { email } = parsed.data;

    // Check user exists — but always return success to prevent email enumeration
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user[0]) {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Invalidate any existing codes for this email
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.email, email));

      // Insert new code
      await db.insert(passwordResetTokens).values({
        email,
        code,
        expiresAt,
      });

      await sendPasswordResetEmail({ to: email, code }).catch(console.error);
    }

    // Always return success — never reveal if email exists
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[forgot password]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}