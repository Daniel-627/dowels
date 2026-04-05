import { db } from "@/lib/db";
import { users, bookings, properties, invoices, payments } from "@/lib/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getLandlordTenants(landlordId: string) {
  const activeBookings = await db
    .select({
      id: bookings.id,
      startDate: bookings.startDate,
      totalAmount: bookings.totalAmount,
      tenantId: bookings.tenantId,
      tenantName: users.name,
      tenantEmail: users.email,
      tenantPhone: users.phone,
      propertyTitle: properties.title,
      propertyId: properties.id,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(
      and(
        eq(properties.landlordId, landlordId),
        eq(bookings.status, "ACTIVE")
      )
    )
    .orderBy(bookings.startDate);

  const withBalance = await Promise.all(
    activeBookings.map(async (booking) => {
      const totalInvoiced = await db
        .select({ total: sum(invoices.amount) })
        .from(invoices)
        .where(eq(invoices.bookingId, booking.id));

      const totalPaid = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
        .where(eq(invoices.bookingId, booking.id));

      const invoiced = Number(totalInvoiced[0]?.total ?? 0);
      const paid = Number(totalPaid[0]?.total ?? 0);
      const balance = invoiced - paid;

      return { ...booking, invoiced, paid, balance };
    })
  );

  return withBalance;
}

export default async function LandlordTenantsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenants = await getLandlordTenants(session.user.id);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tenants</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenants.length} active tenant{tenants.length === 1 ? "" : "s"}
        </p>
      </div>

      {tenants.length > 0 ? (
        <div className="flex flex-col gap-4">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Tenant info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {tenant.tenantName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tenant.tenantName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tenant.tenantEmail}</p>
                    {tenant.tenantPhone && (
                      <p className="text-xs text-gray-400">{tenant.tenantPhone}</p>
                    )}
                  </div>
                </div>

                {/* Property + dates */}
                <div className="sm:text-right">
                  <p className="text-sm font-medium text-gray-900">{tenant.propertyTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Since {new Date(tenant.startDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    KES {Number(tenant.totalAmount).toLocaleString()}/mo
                  </p>
                </div>
              </div>

              {/* Financial summary */}
              <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Total Invoiced</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    KES {tenant.invoiced.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Paid</p>
                  <p className="text-sm font-semibold text-green-600 mt-0.5">
                    KES {tenant.paid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Balance Due</p>
                  <p className={`text-sm font-semibold mt-0.5 ${
                    tenant.balance > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    KES {tenant.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/landlord/bookings/${tenant.id}`}
                  className="text-xs font-medium px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  View Booking
                </Link>
                <Link
                  href={`/dashboard/landlord/invoices?booking=${tenant.id}`}
                  className="text-xs font-medium px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  View Invoices
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">👤</p>
          <p className="text-lg font-medium text-gray-600">No active tenants</p>
          <p className="text-sm mt-2">
            Tenants will appear here once a booking is created and active.
          </p>
        </div>
      )}
    </div>
  );
}