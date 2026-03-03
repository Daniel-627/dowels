import { db } from "@/lib/db";
import { properties, bookings, invoices, payments, rentalRequests, expenses } from "@/lib/db/schema";
import { eq, and, sum, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getLandlordStats(landlordId: string) {
  // Get landlord's property IDs first
  const landlordProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.landlordId, landlordId));

  const propertyIds = landlordProperties.map((p) => p.id);
  const totalProperties = propertyIds.length;

  if (totalProperties === 0) {
    return {
      totalProperties: 0,
      activeBookings: 0,
      pendingRequests: 0,
      unpaidInvoices: 0,
      totalRevenue: 0,
      totalExpenses: 0,
    };
  }

  // Active bookings across all their properties
  const activeBookingsResult = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "ACTIVE"));

  // Pending requests for their properties
  const pendingRequestsResult = await db
    .select({ count: count() })
    .from(rentalRequests)
    .where(
      and(
        eq(rentalRequests.status, "PENDING"),
      )
    );

  // Unpaid invoices
  const unpaidInvoicesResult = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.status, "UNPAID"));

  // Total revenue from payments
  const revenueResult = await db
    .select({ total: sum(payments.amount) })
    .from(payments);

  // Total expenses
  const expensesResult = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses);

  return {
    totalProperties,
    activeBookings: activeBookingsResult[0]?.count ?? 0,
    pendingRequests: pendingRequestsResult[0]?.count ?? 0,
    unpaidInvoices: unpaidInvoicesResult[0]?.count ?? 0,
    totalRevenue: Number(revenueResult[0]?.total ?? 0),
    totalExpenses: Number(expensesResult[0]?.total ?? 0),
  };
}

async function getRecentRequests(landlordId: string) {
  return await db
    .select({
      id: rentalRequests.id,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      propertyTitle: properties.title,
    })
    .from(rentalRequests)
    .leftJoin(properties, eq(rentalRequests.propertyId, properties.id))
    .where(eq(properties.landlordId, landlordId))
    .orderBy(rentalRequests.createdAt)
    .limit(5);
}

export default async function LandlordOverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [stats, recentRequests] = await Promise.all([
    getLandlordStats(session.user.id),
    getRecentRequests(session.user.id),
  ]);

  const netIncome = stats.totalRevenue - stats.totalExpenses;

  const statCards = [
    { label: "My Properties", value: stats.totalProperties, icon: "🏠", color: "bg-blue-50 text-blue-700" },
    { label: "Active Bookings", value: stats.activeBookings, icon: "📅", color: "bg-green-50 text-green-700" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: "📋", color: "bg-yellow-50 text-yellow-700" },
    { label: "Unpaid Invoices", value: stats.unpaidInvoices, icon: "🧾", color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back — here's your portfolio summary.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Financials */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white space-y-4">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Financials
          </p>
          <div>
            <p className="text-xs text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">
              KES {stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold mt-1">
              KES {stats.totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-400">Net Income</p>
            <p className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? "text-green-400" : "text-red-400"}`}>
              KES {netIncome.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Recent Rental Requests
          </h2>
          {recentRequests.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {req.propertyTitle}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    req.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : req.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">
              No requests yet — publish a property to start receiving requests.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}