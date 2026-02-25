import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // ─── Seed Roles ─────────────────────────────────────────────────────────────
  await db.insert(schema.roles).values([
    { name: "ADMIN" },
    { name: "LANDLORD" },
    { name: "TENANT" },
  ]).onConflictDoNothing();

  console.log("✅ Roles seeded");

  // ─── Seed Admin User ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);

  await db.insert(schema.users).values({
    name: "Super Admin",
    email: "admin@dowels.com",
    passwordHash,
    role: "ADMIN",
  }).onConflictDoNothing();

  console.log("✅ Admin user seeded");
  console.log("");
  console.log("─────────────────────────────────");
  console.log("  Admin email:    admin@dowels.com");
  console.log("  Admin password: admin123");
  console.log("  ⚠️  Change this password after first login!");
  console.log("─────────────────────────────────");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });