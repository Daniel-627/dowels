import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, journalLines, journalEntries } from "@/lib/db/schema";
import { eq, sum } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "LANDLORD"].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Get all accounts with their net balances
    const allAccounts = await db.select().from(accounts);

    const balances = await Promise.all(
      allAccounts.map(async (account) => {
        const result = await db
          .select({
            totalDebit: sum(journalLines.debit),
            totalCredit: sum(journalLines.credit),
          })
          .from(journalLines)
          .where(eq(journalLines.accountId, account.id));

        const debit = Number(result[0]?.totalDebit ?? 0);
        const credit = Number(result[0]?.totalCredit ?? 0);

        // Normal balance: Assets/Expenses = Debit, Revenue/Liability/Equity = Credit
        const balance =
          account.type === "ASSET" || account.type === "EXPENSE"
            ? debit - credit
            : credit - debit;

        return { ...account, debit, credit, balance };
      })
    );

    const revenue = balances.filter((a) => a.type === "REVENUE");
    const expenses = balances.filter((a) => a.type === "EXPENSE");
    const assets = balances.filter((a) => a.type === "ASSET");

    const totalRevenue = revenue.reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
    const netIncome = totalRevenue - totalExpenses;
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);

    return NextResponse.json({
      success: true,
      data: {
        revenue,
        expenses,
        assets,
        totalRevenue,
        totalExpenses,
        netIncome,
        totalAssets,
      },
    });
  } catch (err) {
    console.error("[pl report]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}