import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import CreatePropertyForm from "@/components/forms/CreatePropertyForm";

async function getLandlords() {
  return await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "LANDLORD"));
}

export default async function NewPropertyPage() {
  const landlords = await getLandlords();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Property</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new property listing and assign it to a landlord.
        </p>
      </div>
      <CreatePropertyForm landlords={landlords} />
    </div>
  );
}