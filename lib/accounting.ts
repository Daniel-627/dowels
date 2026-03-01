import { db } from "./db";
import { accounts, journalEntries, journalLines } from "./db/schema";
import { eq } from "drizzle-orm";

async function getAccount(code: string) {
  const result = await db
    .select()
    .from(accounts)
    .where(eq(accounts.code, code))
    .limit(1);
  return result[0];
}

export async function recordPaymentJournal({
  amount,
  invoiceType,
  createdBy,
  description,
}: {
  amount: number;
  invoiceType: "RENT" | "UTILITY" | "OTHER";
  createdBy: string;
  description: string;
}) {
  const cash = await getAccount("1001");
  const revenue = await getAccount(
    invoiceType === "RENT" ? "4001"
    : invoiceType === "UTILITY" ? "4002"
    : "4003"
  );

  if (!cash || !revenue) throw new Error("Chart of accounts not seeded");

  const entry = await db
    .insert(journalEntries)
    .values({
      date: new Date().toISOString().split("T")[0],
      description,
      createdBy,
    })
    .returning();

  await db.insert(journalLines).values([
    {
      journalEntryId: entry[0].id,
      accountId: cash.id,
      debit: String(amount),
      credit: "0",
    },
    {
      journalEntryId: entry[0].id,
      accountId: revenue.id,
      debit: "0",
      credit: String(amount),
    },
  ]);
}

export async function recordExpenseJournal({
  amount,
  category,
  createdBy,
  description,
}: {
  amount: number;
  category: "MAINTENANCE" | "UTILITIES" | "INSURANCE" | "OTHER";
  createdBy: string;
  description: string;
}) {
  const cash = await getAccount("1001");
  const expense = await getAccount(
    category === "MAINTENANCE" ? "5001"
    : category === "UTILITIES" ? "5002"
    : category === "INSURANCE" ? "5003"
    : "5004"
  );

  if (!cash || !expense) throw new Error("Chart of accounts not seeded");

  const entry = await db
    .insert(journalEntries)
    .values({
      date: new Date().toISOString().split("T")[0],
      description,
      createdBy,
    })
    .returning();

  await db.insert(journalLines).values([
    {
      journalEntryId: entry[0].id,
      accountId: expense.id,
      debit: String(amount),
      credit: "0",
    },
    {
      journalEntryId: entry[0].id,
      accountId: cash.id,
      debit: "0",
      credit: String(amount),
    },
  ]);
}