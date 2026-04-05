import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/shared/SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user[0]) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details.</p>
      </div>
      <SettingsForm
        user={{
          name: user[0].name,
          email: user[0].email,
          phone: user[0].phone,
          role: user[0].role,
        }}
        showDangerZone={false}
      />
    </div>
  );
}