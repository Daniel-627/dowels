import { pgTable, uuid, varchar, text, decimal, date, timestamp, pgEnum } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["TENANT", "LANDLORD", "ADMIN"]);
export const propertyStatusEnum = pgEnum("property_status", ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "ACTIVE", "ENDED"]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["RENT", "UTILITY", "OTHER"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]);
export const paymentMethodEnum = pgEnum("payment_method", ["CASH", "BANK_TRANSFER", "MPESA", "OTHER"]);
export const expenseCategoryEnum = pgEnum("expense_category", ["MAINTENANCE", "UTILITIES", "INSURANCE", "OTHER"]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("TENANT"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Properties ───────────────────────────────────────────────────────────────
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location").notNull(),
  rentAmount: decimal("rent_amount", { precision: 12, scale: 2 }).notNull(),
  landlordId: uuid("landlord_id").notNull().references(() => users.id),
  status: propertyStatusEnum("status").notNull().default("AVAILABLE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Property Images ──────────────────────────────────────────────────────────
export const propertyImages = pgTable("property_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: varchar("caption", { length: 255 }),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  tenantId: uuid("tenant_id").notNull().references(() => users.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  type: invoiceTypeEnum("type").notNull().default("RENT"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  period: varchar("period", { length: 7 }).notNull(), // e.g. "2026-02"
  status: invoiceStatusEnum("status").notNull().default("UNPAID"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull().default("CASH"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  recordedBy: uuid("recorded_by").notNull().references(() => users.id),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  title: varchar("title", { length: 255 }).notNull(),
  category: expenseCategoryEnum("category").notNull().default("OTHER"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});