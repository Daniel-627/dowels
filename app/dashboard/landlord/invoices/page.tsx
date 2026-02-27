import { db } from "@/lib/db";
import { invoices, bookings, users, properties } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateInvoiceButton from "@/components/shared/CreateInvoiceButton";

async function getLandlordInvoices(landlordId: string) {
  return await db
    .select({
      id: invoices.id,
      type: invoices.type,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      period: invoices.period,
      createdAt: invoices.createdAt,
      tenantName: users.name,
      tenantEmail: users.email,
      propertyTitle: properties.title,
      bookingId: bookings.id,
    })
    .from(invoices)
    .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(properties.landlordId, landlordId))
    .orderBy(invoices.createdAt);
}

async function getLandlordBookings(landlordId: string) {
  return await db
    .select({
      id: bookings.id,
      tenantName: users.name,
      propertyTitle: properties.title,
      totalAmount: bookings.totalAmount,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    // With this:
.where(
  and(
    eq(properties.landlordId, landlordId),
    eq(bookings.status, "ACTIVE")
  )
);
}

const statusStyles: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-orange-100 text-orange-700",
};

const typeStyles: Record<string, string> = {
  RENT: "bg-blue-100 text-blue-700",
  UTILITY: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export default async function LandlordInvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [landlordInvoices, activeBookings] = await Promise.all([
    getLandlordInvoices(session.user.id),
    getLandlordBookings(session.user.id),
  ]);

  const unpaid = landlordInvoices.filter((i) =>
    ["UNPAID", "PARTIALLY_PAID", "OVERDUE"].includes(i.status)
  );
  const paid = landlordInvoices.filter((i) => i.status === "PAID");

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unpaid.length} unpaid · {paid.length} paid
          </p>
        </div>
        <CreateInvoiceButton bookings={activeBookings} />
      </div>

      {/* Invoices table */}
      {landlordInvoices.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {landlordInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{invoice.tenantName}</p>
                    <p className="text-xs text-gray-400">{invoice.tenantEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{invoice.propertyTitle}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeStyles[invoice.type]}`}>
                      {invoice.type.charAt(0) + invoice.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{invoice.period ?? "—"}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    KES {Number(invoice.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[invoice.status]}`}>
                      {invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/landlord/invoices/${invoice.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">🧾</p>
          <p className="text-lg font-medium text-gray-600">No invoices yet</p>
          <p className="text-sm mt-2">
            Create an invoice for an active booking to get started.
          </p>
        </div>
      )}
    </div>
  );
}