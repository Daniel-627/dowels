import {
  pgTable, uuid, varchar, text, decimal,
  date, timestamp, pgEnum, boolean, integer
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["TENANT", "LANDLORD", "ADMIN"]);
export const propertyStatusEnum = pgEnum("property_status", ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "ACTIVE", "ENDED"]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["RENT", "UTILITY", "OTHER"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]);
export const paymentMethodEnum = pgEnum("payment_method", ["CASH", "BANK_TRANSFER", "MPESA", "OTHER"]);
export const expenseCategoryEnum = pgEnum("expense_category", ["MAINTENANCE", "UTILITIES", "INSURANCE", "OTHER"]);
export const rentalRequestStatusEnum = pgEnum("rental_request_status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export const maintenancePriorityEnum = pgEnum("maintenance_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", ["OPEN", "IN_PROGRESS", "RESOLVED"]);



// ─── Phase 2 Enums (commented out until Phase 2) ─────────────────────────────
export const accountTypeEnum = pgEnum("account_type", ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);

// ─── Roles ────────────────────────────────────────────────────────────────────
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("TENANT"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Properties ───────────────────────────────────────────────────────────────
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location").notNull(),
  rentAmount: decimal("rent_amount", { precision: 12, scale: 2 }).notNull(),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  landlordId: uuid("landlord_id").notNull().references(() => users.id),
  status: propertyStatusEnum("status").notNull().default("AVAILABLE"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Property Images ──────────────────────────────────────────────────────────
export const propertyImages = pgTable("property_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: varchar("caption", { length: 255 }),
});

// ─── Rental Requests ──────────────────────────────────────────────────────────
export const rentalRequests = pgTable("rental_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  tenantId: uuid("tenant_id").notNull().references(() => users.id),
  moveInDate: date("move_in_date").notNull(),
  occupants: integer("occupants").notNull().default(1),
  employmentInfo: text("employment_info"),
  message: text("message"),
  status: rentalRequestStatusEnum("status").notNull().default("PENDING"),
  reviewedBy: uuid("reviewed_by").references(() => users.id), // landlord or admin who acted on it
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  tenantId: uuid("tenant_id").notNull().references(() => users.id),
  rentalRequestId: uuid("rental_request_id").references(() => rentalRequests.id), // trace back to request
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
  period: varchar("period", { length: 7 }),
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

// ─── Phase 2: Accounting Engine (uncomment when ready) ───────────────────────

export const accounts = pgTable("accounts", {
   id: uuid("id").defaultRandom().primaryKey(),
   name: varchar("name", { length: 255 }).notNull(),
   type: accountTypeEnum("type").notNull(),
   code: varchar("code", { length: 20 }).notNull().unique(),
 });

 export const journalEntries = pgTable("journal_entries", {
   id: uuid("id").defaultRandom().primaryKey(),
   date: date("date").notNull(),
   description: text("description"),
   createdBy: uuid("created_by").notNull().references(() => users.id),
   createdAt: timestamp("created_at").defaultNow().notNull(),
 });

 export const journalLines = pgTable("journal_lines", {
   id: uuid("id").defaultRandom().primaryKey(),
   journalEntryId: uuid("journal_entry_id").notNull().references(() => journalEntries.id),
   accountId: uuid("account_id").notNull().references(() => accounts.id),
   debit: decimal("debit", { precision: 12, scale: 2 }).notNull().default("0"),
   credit: decimal("credit", { precision: 12, scale: 2 }).notNull().default("0"),
});



export const maintenanceRequests = pgTable("maintenance_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  tenantId: uuid("tenant_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: maintenancePriorityEnum("priority").notNull().default("MEDIUM"),
  status: maintenanceStatusEnum("status").notNull().default("OPEN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});