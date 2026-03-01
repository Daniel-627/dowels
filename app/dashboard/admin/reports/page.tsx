import { db } from "@/lib/db";
import { payments, invoices, bookings, users, properties, expenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClient from "@/components/shared/ReportsClient";
import PLStatement from "@/components/shared/PLStatement";

async function getPlatformReportData() {
  const [allPayments, allExpenses, allInvoices] = await Promise.all([
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        paidAt: payments.paidAt,
        tenantName: users.name,
        tenantEmail: users.email,
        propertyTitle: properties.title,
        propertyLocation: properties.location,
        invoiceType: invoices.type,
        invoicePeriod: invoices.period,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(users, eq(bookings.tenantId, users.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .orderBy(payments.paidAt),

    db
      .select({
        id: expenses.id,
        title: expenses.title,
        category: expenses.category,
        amount: expenses.amount,
        date: expenses.date,
        description: expenses.description,
        propertyTitle: properties.title,
        propertyLocation: properties.location,
      })
      .from(expenses)
      .leftJoin(properties, eq(expenses.propertyId, properties.id))
      .orderBy(expenses.date),

    db
      .select({
        id: invoices.id,
        type: invoices.type,
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        period: invoices.period,
        tenantName: users.name,
        propertyTitle: properties.title,
      })
      .from(invoices)
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(users, eq(bookings.tenantId, users.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .orderBy(invoices.dueDate),
  ]);

  const totalRevenue = allPayments.reduce(
    (sum, p) => sum + Number(p.amount), 0
  );
  const totalExpenses = allExpenses.reduce(
    (sum, e) => sum + Number(e.amount), 0
  );
  const netIncome = totalRevenue - totalExpenses;

  return {
    payments: allPayments,
    expenses: allExpenses,
    invoices: allInvoices,
    summary: { totalRevenue, totalExpenses, netIncome },
  };
}

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const data = await getPlatformReportData();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Financial overview across all landlords and properties.
        </p>
      </div>
      <ReportsClient data={data} />

      <div className="mt-8">
        <PLStatement />
      </div>
    </div>
  );
}