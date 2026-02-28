import { db } from "@/lib/db";
import { expenses, properties } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogExpenseButton from "@/components/shared/LogExpenseButton";

async function getLandlordExpenses(landlordId: string) {
  return await db
    .select({
      id: expenses.id,
      title: expenses.title,
      category: expenses.category,
      amount: expenses.amount,
      date: expenses.date,
      description: expenses.description,
      propertyTitle: properties.title,
      propertyId: properties.id,
    })
    .from(expenses)
    .leftJoin(properties, eq(expenses.propertyId, properties.id))
    .where(eq(properties.landlordId, landlordId))
    .orderBy(expenses.date);
}

async function getLandlordProperties(landlordId: string) {
  return await db
    .select({ id: properties.id, title: properties.title })
    .from(properties)
    .where(eq(properties.landlordId, landlordId));
}

const categoryStyles: Record<string, string> = {
  MAINTENANCE: "bg-orange-100 text-orange-700",
  UTILITIES: "bg-blue-100 text-blue-700",
  INSURANCE: "bg-purple-100 text-purple-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export default async function LandlordExpensesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [landlordExpenses, landlordProperties] = await Promise.all([
    getLandlordExpenses(session.user.id),
    getLandlordProperties(session.user.id),
  ]);

  const totalExpenses = landlordExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount), 0
  );

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">
            {landlordExpenses.length} expense{landlordExpenses.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-red-50 text-red-700 rounded-2xl px-6 py-3 text-right">
            <p className="text-xs text-red-400">Total Expenses</p>
            <p className="text-xl font-bold mt-0.5">
              KES {totalExpenses.toLocaleString()}
            </p>
          </div>
          <LogExpenseButton properties={landlordProperties} />
        </div>
      </div>

      {/* Table */}
      {landlordExpenses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {landlordExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{exp.title}</p>
                    {exp.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{exp.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{exp.propertyTitle}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryStyles[exp.category]}`}>
                      {exp.category.charAt(0) + exp.category.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(exp.date).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    KES {Number(exp.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 text-gray-400">
          <p className="text-4xl mb-4">💸</p>
          <p className="text-lg font-medium text-gray-600">No expenses logged</p>
          <p className="text-sm mt-2">
            Track maintenance, utilities and other costs here.
          </p>
        </div>
      )}
    </div>
  );
}