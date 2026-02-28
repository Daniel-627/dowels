import { db } from "@/lib/db";
import { bookings, users, properties, invoices, payments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import EndBookingButton from "@/components/shared/EndBookingButton";

async function getBooking(id: string, landlordId: string) {
  const result = await db
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
      propertyId: properties.id,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(
      and(
        eq(bookings.id, id),
        eq(properties.landlordId, landlordId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

async function getBookingInvoices(bookingId: string) {
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.bookingId, bookingId))
    .orderBy(invoices.createdAt);
}

async function getBookingPayments(bookingId: string) {
  const bookingInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.bookingId, bookingId));

  if (bookingInvoices.length === 0) return [];

  const allPayments = await Promise.all(
    bookingInvoices.map((inv) =>
      db.select().from(payments).where(eq(payments.invoiceId, inv.id))
    )
  );

  return allPayments.flat();
}

const invoiceStatusStyles: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-orange-100 text-orange-700",
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [booking, bookingInvoices, bookingPayments] = await Promise.all([
    getBooking(id, session.user.id),
    getBookingInvoices(id),
    getBookingPayments(id),
  ]);

  if (!booking) notFound();

  const totalInvoiced = bookingInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount), 0
  );
  const totalPaid = bookingPayments.reduce(
    (sum, pay) => sum + Number(pay.amount), 0
  );
  const balance = totalInvoiced - totalPaid;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/landlord/bookings"
          className="text-xs text-gray-400 hover:text-gray-600 transition mb-2 inline-block"
        >
          ← Back to Bookings
        </Link>
        {booking.status === "ACTIVE" && (
          <EndBookingButton bookingId={booking.id} />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {booking.propertyTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{booking.propertyLocation}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">Monthly Rent</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            KES {Number(booking.totalAmount).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">Total Invoiced</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            KES {totalInvoiced.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-lg font-bold text-green-600 mt-1">
            KES {totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">Balance Due</p>
          <p className={`text-lg font-bold mt-1 ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
            KES {balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tenant + booking info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Tenant</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-base font-medium text-gray-600">
              {booking.tenantName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{booking.tenantName}</p>
              <p className="text-xs text-gray-400">{booking.tenantEmail}</p>
              {booking.tenantPhone && (
                <p className="text-xs text-gray-400">{booking.tenantPhone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Booking Info</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Start Date</span>
              <span className="font-medium text-gray-900">
                {new Date(booking.startDate).toLocaleDateString("en-KE", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">End Date</span>
              <span className="font-medium text-gray-900">
                {booking.endDate
                  ? new Date(booking.endDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })
                  : "Open-ended"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                booking.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Invoices ({bookingInvoices.length})
          </h2>
          <Link
            href="/dashboard/landlord/invoices"
            className="text-xs text-blue-600 hover:text-blue-800 transition"
          >
            Create Invoice →
          </Link>
        </div>

        {bookingInvoices.length > 0 ? (
          <div className="flex flex-col gap-3">
            {bookingInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {inv.type.charAt(0) + inv.type.slice(1).toLowerCase()} Invoice
                    {inv.period ? ` — ${inv.period}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Due {new Date(inv.dueDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    KES {Number(inv.amount).toLocaleString()}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${invoiceStatusStyles[inv.status]}`}>
                    {inv.status.charAt(0) + inv.status.slice(1).toLowerCase().replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            No invoices yet for this booking.
          </p>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Payments ({bookingPayments.length})
          </h2>
          <Link
            href="/dashboard/landlord/payments"
            className="text-xs text-blue-600 hover:text-blue-800 transition"
          >
            Record Payment →
          </Link>
        </div>

        {bookingPayments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {bookingPayments.map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {pay.method.charAt(0) + pay.method.slice(1).toLowerCase().replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(pay.paidAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-600">
                  + KES {Number(pay.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            No payments recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}