import { db } from "@/lib/db";
import { properties, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import PublishToggle from "@/components/shared/PublishToggle";

async function getProperties() {
  return await db
    .select({
      id: properties.id,
      title: properties.title,
      location: properties.location,
      rentAmount: properties.rentAmount,
      status: properties.status,
      isPublished: properties.isPublished,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      createdAt: properties.createdAt,
      landlordName: users.name,
      landlordEmail: users.email,
    })
    .from(properties)
    .leftJoin(users, eq(properties.landlordId, users.id))
    .orderBy(properties.createdAt);
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  OCCUPIED: "bg-red-100 text-red-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
};

export default async function AdminPropertiesPage() {
  const allProperties = await getProperties();

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            {allProperties.length} total propert{allProperties.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Link
          href="/dashboard/admin/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
        >
          + Add Property
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Landlord</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rent</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Published</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allProperties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{property.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{property.location}</p>
                  <p className="text-xs text-gray-400">
                    {property.bedrooms} bed · {property.bathrooms} bath
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">{property.landlordName ?? "—"}</p>
                  <p className="text-xs text-gray-400">{property.landlordEmail ?? ""}</p>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  KES {Number(property.rentAmount).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[property.status]}`}>
                    {property.status.charAt(0) + property.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <PublishToggle
                    propertyId={property.id}
                    isPublished={property.isPublished}
                  />
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/admin/properties/${property.id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {allProperties.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm font-medium">No properties yet</p>
            <p className="text-xs mt-1">Click "Add Property" to create the first listing.</p>
          </div>
        )}
      </div>
    </div>
  );
}