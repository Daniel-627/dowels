import { db } from "./index";
import { accounts } from "./schema";

const chartOfAccounts = [
  // Assets
  { code: "1001", name: "Cash and Bank", type: "ASSET" as const },

  // Revenue
  { code: "4001", name: "Rental Revenue", type: "REVENUE" as const },
  { code: "4002", name: "Utility Revenue", type: "REVENUE" as const },
  { code: "4003", name: "Other Revenue", type: "REVENUE" as const },

  // Expenses
  { code: "5001", name: "Maintenance Expense", type: "EXPENSE" as const },
  { code: "5002", name: "Utilities Expense", type: "EXPENSE" as const },
  { code: "5003", name: "Insurance Expense", type: "EXPENSE" as const },
  { code: "5004", name: "Other Expense", type: "EXPENSE" as const },
];

async function seed() {
  console.log("Seeding chart of accounts...");

  for (const account of chartOfAccounts) {
    await db
      .insert(accounts)
      .values(account)
      .onConflictDoNothing();
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});