import { db } from "@/lib/db";
import { bookings, users, properties, rentalRequests } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateBookingButton from "@/components/shared/CreateBookingButton";

async function getLandlordBookings(landlordId: string) {
  return await db
    .select({
      id: bookings.id,
      status: bookings.status,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      totalAmount: bookings.totalAmount,
      createdAt: bookings.createdAt,
      tenantName: users.name,
      tenantEmail: users.email,
      tenantPhone: users.phone,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(properties.landlordId, landlordId))
    .orderBy(bookings.createdAt);
}

async function getApprovedRequestsWithoutBooking(landlordId: string) {
  return await db
    .select({
      id: rentalRequests.id,
      moveInDate: rentalRequests.moveInDate,
      tenantName: users.name,
      tenantEmail: users.email,
      propertyTitle: properties.title,
      propertyRent: properties.rentAmount,
      propertyId: properties.id,
      tenantId: rentalRequests.tenantId,
    })
    .from(rentalRequests)
    .leftJoin(users, eq(rentalRequests.tenantId, users.id))
    .leftJoin(properties, eq(rentalRequests.propertyId, properties.id))
    .where(
  and(
    eq(rentalRequests.status, "APPROVED"),
    eq(properties.landlordId, landlordId)
  )
);
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  ENDED: "bg-gray-100 text-gray-600",
};

export default async function LandlordBookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [landlordBookings, approvedRequests] = await Promise.all([
    getLandlordBookings(session.user.id),
    getApprovedRequestsWithoutBooking(session.user.id),
  ]);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">
          {landlordBookings.length} total booking{landlordBookings.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Approved requests awaiting booking */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Approved Requests — Create Booking
          </h2>
          <div className="flex flex-col gap-4">
            {approvedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-green-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{req.propertyTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    KES {Number(req.propertyRent).toLocaleString()}/mo
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {req.tenantName?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700">{req.tenantName}</p>
                    <p className="text-xs text-gray-400">{req.tenantEmail}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Preferred move-in: {new Date(req.moveInDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <CreateBookingButton
                  requestId={req.id}
                  propertyId={req.propertyId!}
                  tenantId={req.tenantId}
                  moveInDate={req.moveInDate}
                  rentAmount={Number(req.propertyRent)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active bookings */}
      {landlordBookings.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            All Bookings
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rent/mo</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {landlordBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{booking.tenantName}</p>
                      <p className="text-xs text-gray-400">{booking.tenantEmail}</p>
                      {booking.tenantPhone && (
                        <p className="text-xs text-gray-400">{booking.tenantPhone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{booking.propertyTitle}</p>
                      <p className="text-xs text-gray-400">{booking.propertyLocation}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(booking.startDate).toLocaleDateString("en-KE", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      KES {Number(booking.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[booking.status]}`}>
                        {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/landlord/bookings/${booking.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-lg font-medium text-gray-600">No bookings yet</p>
          <p className="text-sm mt-2">
            Approve a rental request to create your first booking.
          </p>
        </div>
      )}
    </div>
  );
}