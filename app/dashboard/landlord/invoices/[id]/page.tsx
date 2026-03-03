import { db } from "@/lib/db";
import { invoices, bookings, users, properties, payments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import RecordPaymentButton from "@/components/shared/RecordPaymentButton";

async function getInvoice(id: string, landlordId: string) {
  const result = await db
    .select({
      id: invoices.id,
      type: invoices.type,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      period: invoices.period,
      createdAt: invoices.createdAt,
      bookingId: invoices.bookingId,
      tenantName: users.name,
      tenantEmail: users.email,
      tenantPhone: users.phone,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
    })
    .from(invoices)
    .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
    .leftJoin(users, eq(bookings.tenantId, users.id))
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(
      and(
        eq(invoices.id, id),
        eq(properties.landlordId, landlordId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

async function getInvoicePayments(invoiceId: string) {
  return await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(payments.paidAt);
}

const statusStyles: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-orange-100 text-orange-700",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [invoice, invoicePayments] = await Promise.all([
    getInvoice(id, session.user.id),
    getInvoicePayments(id),
  ]);

  if (!invoice) notFound();

  const totalPaid = invoicePayments.reduce(
    (sum, pay) => sum + Number(pay.amount), 0
  );
  const balance = Number(invoice.amount) - totalPaid;

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/landlord/invoices"
          className="text-xs text-gray-400 hover:text-gray-600 transition mb-2 inline-block"
        >
          ← Back to Invoices
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {invoice.type.charAt(0) + invoice.type.slice(1).toLowerCase()} Invoice
              {invoice.period ? ` — ${invoice.period}` : ""}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {invoice.propertyTitle} · {invoice.propertyLocation}
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyles[invoice.status]}`}>
            {invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase().replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-xs text-gray-500">Invoice Amount</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            KES {Number(invoice.amount).toLocaleString()}
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

      {/* Invoice details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tenant</span>
            <div className="text-right">
              <p className="font-medium text-gray-900">{invoice.tenantName}</p>
              <p className="text-xs text-gray-400">{invoice.tenantEmail}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Due Date</span>
            <span className="font-medium text-gray-900">
              {new Date(invoice.dueDate).toLocaleDateString("en-KE", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>
          {invoice.period && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Period</span>
              <span className="font-medium text-gray-900">{invoice.period}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Created</span>
            <span className="font-medium text-gray-900">
              {new Date(invoice.createdAt).toLocaleDateString("en-KE", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Payments ({invoicePayments.length})
          </h2>
          {balance > 0 && (
            <RecordPaymentButton
              invoiceId={invoice.id}
              balance={balance}
            />
          )}
        </div>

        {invoicePayments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {invoicePayments.map((pay) => (
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

      {balance <= 0 && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
          <p className="text-sm font-medium text-green-700">
            Invoice fully paid
          </p>
        </div>
      )}
    </div>
  );
}