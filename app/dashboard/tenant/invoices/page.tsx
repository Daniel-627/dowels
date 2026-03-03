import { db } from "@/lib/db";
import { invoices, bookings, properties, payments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getTenantInvoices(tenantId: string) {
  const tenantInvoices = await db
    .select({
      id: invoices.id,
      type: invoices.type,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      period: invoices.period,
      createdAt: invoices.createdAt,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
    })
    .from(invoices)
    .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(bookings.tenantId, tenantId))
    .orderBy(invoices.createdAt);

  return tenantInvoices;
}

const statusStyles: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-orange-100 text-orange-700",
};

export default async function TenantInvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantInvoices = await getTenantInvoices(session.user.id);

  const totalDue = tenantInvoices
    .filter((i) => ["UNPAID", "PARTIALLY_PAID", "OVERDUE"].includes(i.status))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPaid = tenantInvoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenantInvoices.length} invoice{tenantInvoices.length === 1 ? "" : "s"} total
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <p className="text-xs text-red-400">Total Due</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            KES {totalDue.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <p className="text-xs text-green-400">Total Paid</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            KES {totalPaid.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoices */}
      {tenantInvoices.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenantInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{inv.propertyTitle}</p>
                    <p className="text-xs text-gray-400">{inv.propertyLocation}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700 capitalize">
                    {inv.type.toLowerCase()}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {inv.period ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(inv.dueDate).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    KES {Number(inv.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[inv.status]}`}>
                      {inv.status.charAt(0) + inv.status.slice(1).toLowerCase().replace("_", " ")}
                    </span>
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
            Invoices will appear here once your landlord creates them.
          </p>
        </div>
      )}
    </div>
  );
}