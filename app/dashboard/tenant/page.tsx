import { db } from "@/lib/db";
import { rentalRequests, bookings, invoices, properties, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getTenantOverview(tenantId: string) {
  const [
    tenantRequests,
    activeBookings,
    unpaidInvoices,
  ] = await Promise.all([
    db
      .select({
        id: rentalRequests.id,
        status: rentalRequests.status,
        createdAt: rentalRequests.createdAt,
        propertyTitle: properties.title,
        propertyLocation: properties.location,
        propertyRent: properties.rentAmount,
      })
      .from(rentalRequests)
      .leftJoin(properties, eq(rentalRequests.propertyId, properties.id))
      .where(eq(rentalRequests.tenantId, tenantId))
      .orderBy(rentalRequests.createdAt),

    db
      .select({
        id: bookings.id,
        startDate: bookings.startDate,
        totalAmount: bookings.totalAmount,
        propertyTitle: properties.title,
        propertyLocation: properties.location,
        landlordName: users.name,
        landlordEmail: users.email,
        landlordPhone: users.phone,
      })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(users, eq(properties.landlordId, users.id))
      .where(
        and(
          eq(bookings.tenantId, tenantId),
          eq(bookings.status, "ACTIVE")
        )
      ),

    db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        status: invoices.status,
        type: invoices.type,
        period: invoices.period,
        propertyTitle: properties.title,
      })
      .from(invoices)
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(
        and(
          eq(bookings.tenantId, tenantId),
          eq(invoices.status, "UNPAID")
        )
      ),
  ]);

  const totalDue = unpaidInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount), 0
  );

  return {
    requests: tenantRequests,
    activeBookings,
    unpaidInvoices,
    totalDue,
  };
}

const requestStatusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default async function TenantOverviewPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { requests, activeBookings, unpaidInvoices, totalDue } =
    await getTenantOverview(session.user.id);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's your rental summary.
        </p>
      </div>

      {/* Active bookings */}
      {activeBookings.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Active Tenancies
          </h2>
          <div className="flex flex-col gap-3">
            {activeBookings.map((booking) => (
              <div key={booking.id} className="bg-gray-900 rounded-2xl p-6 text-white">
                <h2 className="text-xl font-bold">{booking.propertyTitle}</h2>
                <p className="text-gray-400 text-sm mt-1">{booking.propertyLocation}</p>
                <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Monthly Rent</p>
                    <p className="text-lg font-bold mt-0.5">
                      KES {Number(booking.totalAmount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-sm font-medium mt-0.5">
                      {new Date(booking.startDate).toLocaleDateString("en-KE", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Landlord</p>
                    <p className="text-sm font-medium mt-0.5">{booking.landlordName}</p>
                    <p className="text-xs text-gray-500">{booking.landlordEmail}</p>
                    {booking.landlordPhone && (
                      <p className="text-xs text-gray-500">{booking.landlordPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 text-center">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-sm font-medium text-gray-700">No active tenancy</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Browse available properties and submit a request.
          </p>
          <Link
            href="/#properties"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
          >
            Browse Properties
          </Link>
        </div>
      )}

      {/* Balance due */}
      {totalDue > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">
              You have {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Total due: KES {totalDue.toLocaleString()}
            </p>
          </div>
          <Link
            href="/dashboard/tenant/invoices"
            className="text-xs font-medium px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            View Invoices
          </Link>
        </div>
      )}

      {/* Recent requests */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            My Rental Requests
          </h2>
          <Link
            href="/dashboard/tenant/requests"
            className="text-xs text-blue-600 hover:text-blue-800 transition"
          >
            View all →
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="flex flex-col gap-3">
            {requests.slice(0, 5).map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {req.propertyTitle}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {req.propertyLocation} · KES {Number(req.propertyRent).toLocaleString()}/mo
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${requestStatusStyles[req.status]}`}>
                  {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No requests yet — browse properties to get started.
          </p>
        )}
      </div>
    </div>
  );
}