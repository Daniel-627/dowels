import { db } from "@/lib/db";
import { payments, invoices, bookings, users, properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getLandlordPayments(landlordId: string) {
  return await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      paidAt: payments.paidAt,
      tenantName: users.name,
      propertyTitle: properties.title,
      invoiceType: invoices.type,
      invoicePeriod: invoices.period,
      invoiceId: invoices.id,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(properties.landlordId, landlordId))
    .orderBy(payments.paidAt);
}

const methodStyles: Record<string, string> = {
  CASH: "bg-green-100 text-green-700",
  BANK_TRANSFER: "bg-blue-100 text-blue-700",
  MPESA: "bg-emerald-100 text-emerald-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export default async function LandlordPaymentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const landlordPayments = await getLandlordPayments(session.user.id);

  const totalRevenue = landlordPayments.reduce(
    (sum, pay) => sum + Number(pay.amount), 0
  );

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {landlordPayments.length} payment{landlordPayments.length === 1 ? "" : "s"} recorded
          </p>
        </div>
        <div className="bg-gray-900 text-white rounded-2xl px-6 py-3 text-right">
          <p className="text-xs text-gray-400">Total Revenue</p>
          <p className="text-xl font-bold mt-0.5">
            KES {totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      {landlordPayments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Method</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {landlordPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {pay.tenantName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {pay.propertyTitle}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {pay.invoiceType?.charAt(0) + pay.invoiceType!.slice(1).toLowerCase()}
                    {pay.invoicePeriod ? ` — ${pay.invoicePeriod}` : ""}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${methodStyles[pay.method ?? "OTHER"]}`}>
                      {pay.method?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(pay.paidAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    KES {Number(pay.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">💳</p>
          <p className="text-lg font-medium text-gray-600">No payments yet</p>
          <p className="text-sm mt-2">
            Record a payment from an invoice to see it here.
          </p>
        </div>
      )}
    </div>
  );
}