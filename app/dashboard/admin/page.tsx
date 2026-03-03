import { db } from "@/lib/db";
import { properties, users, rentalRequests, invoices, payments } from "@/lib/db/schema";
import { eq, count, sum, and } from "drizzle-orm";

async function getStats() {
  const [
    totalProperties,
    activeTenants,
    pendingRequests,
    unpaidInvoices,
    totalRevenue,
  ] = await Promise.all([
    db.select({ count: count() }).from(properties),
    db.select({ count: count() }).from(users).where(eq(users.role, "TENANT")),
    db.select({ count: count() }).from(rentalRequests).where(eq(rentalRequests.status, "PENDING")),
    db.select({ count: count() }).from(invoices).where(eq(invoices.status, "UNPAID")),
    db.select({ total: sum(payments.amount) }).from(payments),
  ]);

  return {
    totalProperties: totalProperties[0]?.count ?? 0,
    activeTenants: activeTenants[0]?.count ?? 0,
    pendingRequests: pendingRequests[0]?.count ?? 0,
    unpaidInvoices: unpaidInvoices[0]?.count ?? 0,
    totalRevenue: Number(totalRevenue[0]?.total ?? 0),
  };
}

async function getRecentActivity() {
  const recentRequests = await db
    .select({
      id: rentalRequests.id,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      tenantId: rentalRequests.tenantId,
      propertyId: rentalRequests.propertyId,
    })
    .from(rentalRequests)
    .orderBy(rentalRequests.createdAt)
    .limit(5);

  return recentRequests;
}

const statCards = [
  { label: "Total Properties", key: "totalProperties", icon: "🏠", color: "bg-blue-50 text-blue-700" },
  { label: "Active Tenants", key: "activeTenants", icon: "👤", color: "bg-green-50 text-green-700" },
  { label: "Pending Requests", key: "pendingRequests", icon: "📋", color: "bg-yellow-50 text-yellow-700" },
  { label: "Unpaid Invoices", key: "unpaidInvoices", icon: "🧾", color: "bg-red-50 text-red-700" },
];

export default async function AdminOverviewPage() {
  const [stats, recentActivity] = await Promise.all([
    getStats(),
    getRecentActivity(),
  ]);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
       <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back — here's what's happening on Dowels.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats[card.key as keyof typeof stats].toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue card */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold mt-2">
            KES {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time from recorded payments</p>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Recent Rental Requests
          </h2>
          {recentActivity.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      New rental request
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    item.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : item.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">
              No activity yet — add properties to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}