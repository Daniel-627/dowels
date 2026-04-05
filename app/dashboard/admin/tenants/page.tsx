import { db } from "@/lib/db";
import { users, bookings, properties, rentalRequests } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getAllTenants() {
  const tenants = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "TENANT"))
    .orderBy(users.createdAt);

  const withStats = await Promise.all(
    tenants.map(async (tenant) => {
      const [activeBooking, requestCount] = await Promise.all([
        db
          .select({ propertyTitle: properties.title })
          .from(bookings)
          .leftJoin(properties, eq(bookings.propertyId, properties.id))
          .where(
            and(
              eq(bookings.tenantId, tenant.id),
              eq(bookings.status, "ACTIVE")
            )
          )
          .limit(1),

        db
          .select({ count: count() })
          .from(rentalRequests)
          .where(eq(rentalRequests.tenantId, tenant.id)),
      ]);

      return {
        ...tenant,
        activeProperty: activeBooking[0]?.propertyTitle ?? null,
        requestCount: requestCount[0]?.count ?? 0,
      };
    })
  );

  return withStats;
}

export default async function AdminTenantsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const tenants = await getAllTenants();

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tenants</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenants.length} registered tenant{tenants.length === 1 ? "" : "s"}
        </p>
      </div>

      {tenants.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Tenancy</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Requests</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-xs text-gray-400">{tenant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {tenant.phone ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {tenant.activeProperty ? (
                      <span className="text-sm text-gray-700">{tenant.activeProperty}</span>
                    ) : (
                      <span className="text-xs text-gray-400">No active tenancy</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {tenant.requestCount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      tenant.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {tenant.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(tenant.createdAt).toLocaleDateString("en-KE", {
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
          <p className="text-lg font-medium text-gray-600">No tenants yet</p>
          <p className="text-sm mt-2">
            Tenants will appear here once they register.
          </p>
        </div>
      )}
    </div>
  );
}