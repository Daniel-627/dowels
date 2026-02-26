import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["TENANT", "LANDLORD"]),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    // Only admin can change roles
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    const { userId, role } = parsed.data;

    await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[role update]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}