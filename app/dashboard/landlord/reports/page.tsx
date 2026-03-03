import { db } from "@/lib/db";
import { payments, invoices, bookings, users, properties, expenses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClient from "@/components/shared/ReportsClient";

async function getLandlordReportData(landlordId: string) {
  const [landlordPayments, landlordExpenses, landlordInvoices] = await Promise.all([
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        paidAt: payments.paidAt,
        tenantName: users.name,
        tenantEmail: users.email,
        propertyTitle: properties.title,
        invoiceType: invoices.type,
        invoicePeriod: invoices.period,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(users, eq(bookings.tenantId, users.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(properties.landlordId, landlordId))
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
      })
      .from(expenses)
      .leftJoin(properties, eq(expenses.propertyId, properties.id))
      .where(eq(properties.landlordId, landlordId))
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
      .where(eq(properties.landlordId, landlordId))
      .orderBy(invoices.dueDate),
  ]);

  const totalRevenue = landlordPayments.reduce(
    (sum, p) => sum + Number(p.amount), 0
  );
  const totalExpenses = landlordExpenses.reduce(
    (sum, e) => sum + Number(e.amount), 0
  );
  const netIncome = totalRevenue - totalExpenses;

  return {
    payments: landlordPayments,
    expenses: landlordExpenses,
    invoices: landlordInvoices,
    summary: { totalRevenue, totalExpenses, netIncome },
  };
}

export default async function LandlordReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const data = await getLandlordReportData(session.user.id);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Export your financial data as CSV or PDF.
        </p>
      </div>
      <ReportsClient data={data} />
    </div>
  );
}