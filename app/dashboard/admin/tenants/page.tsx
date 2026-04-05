import { db } from "@/lib/db";
import { users, bookings, properties, rentalRequests } from "@/lib/db/schema";
import { eq, and, count, alias } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const landlords = alias(users, "landlords");

async function getActiveTenants() {
  return await db
    .select({
      tenantId: users.id,
      tenantName: users.name,
      tenantEmail: users.email,
      tenantPhone: users.phone,
      joinedAt: users.createdAt,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      bookingId: bookings.id,
      bookingStart: bookings.startDate,
      monthlyRent: bookings.totalAmount,
      landlordName: landlords.name,
      landlordEmail: landlords.email,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .leftJoin(landlords, eq(properties.landlordId, landlords.id))
    .where(eq(bookings.status, "ACTIVE"))
    .orderBy(bookings.startDate);
}

export default async function AdminTenantsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const tenants = await getActiveTenants();

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Active Tenants</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenants.length} tenant{tenants.length === 1 ? "" : "s"} currently renting
        </p>
      </div>

      {tenants.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Landlord</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rent/mo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((tenant) => (
                <tr key={tenant.bookingId} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {tenant.tenantName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                        <p className="text-xs text-gray-400">{tenant.tenantEmail}</p>
                        {tenant.tenantPhone && (
                          <p className="text-xs text-gray-400">{tenant.tenantPhone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700">{tenant.propertyTitle}</p>
                    <p className="text-xs text-gray-400">{tenant.propertyLocation}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700">{tenant.landlordName}</p>
                    <p className="text-xs text-gray-400">{tenant.landlordEmail}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    KES {Number(tenant.monthlyRent).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(tenant.bookingStart).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">👤</p>
          <p className="text-lg font-medium text-gray-600">No active tenants</p>
          <p className="text-sm mt-2">
            Tenants will appear here once a booking is active.
          </p>
        </div>
      )}
    </div>
  );
}