import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandlordCreatePropertyForm from "@/components/forms/LandlordCreatePropertyForm";

export default async function LandlordNewPropertyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Property</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new listing. Admin will review and publish it.
        </p>
      </div>
      <LandlordCreatePropertyForm landlordId={session.user.id} />
    </div>
  );
}