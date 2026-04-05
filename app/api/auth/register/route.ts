import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0].message,
      }, { status: 400 });
    }

    const { name, email, phone, password } = parsed.data;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: "An account with this email already exists",
      }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      name,
      email,
      phone: phone ?? null,
      passwordHash,
      role: "TENANT",
      isActive: true,
    });

    await sendWelcomeEmail({ to: email, name }).catch(console.error);

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({
      success: false,
      error: "Something went wrong. Please try again.",
    }, { status: 500 });
  }
}