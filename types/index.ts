import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  users, properties, propertyImages,
  bookings, invoices, payments, expenses, roles, rentalRequests
} from "@/lib/db/schema";

// ─── Select Types (reading from DB) ──────────────────────────────────────────
export type User = InferSelectModel<typeof users>;
export type Role = InferSelectModel<typeof roles>;
export type Property = InferSelectModel<typeof properties>;
export type PropertyImage = InferSelectModel<typeof propertyImages>;
export type Booking = InferSelectModel<typeof bookings>;
export type Invoice = InferSelectModel<typeof invoices>;
export type Payment = InferSelectModel<typeof payments>;
export type Expense = InferSelectModel<typeof expenses>;

// ─── Insert Types (writing to DB) ────────────────────────────────────────────
export type NewUser = InferInsertModel<typeof users>;
export type NewProperty = InferInsertModel<typeof properties>;
export type NewBooking = InferInsertModel<typeof bookings>;
export type NewInvoice = InferInsertModel<typeof invoices>;
export type NewPayment = InferInsertModel<typeof payments>;
export type NewExpense = InferInsertModel<typeof expenses>;

// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = "TENANT" | "LANDLORD" | "ADMIN";
export type PropertyStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type BookingStatus = "PENDING" | "ACTIVE" | "ENDED";
export type InvoiceType = "RENT" | "UTILITY" | "OTHER";
export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "MPESA" | "OTHER";
export type ExpenseCategory = "MAINTENANCE" | "UTILITIES" | "INSURANCE" | "OTHER";

// ─── Extended Types (joins) ───────────────────────────────────────────────────
export type PropertyWithLandlord = Property & {
  landlord: User;
};

export type BookingWithDetails = Booking & {
  property: Property;
  tenant: User;
};

export type InvoiceWithBooking = Invoice & {
  booking: BookingWithDetails;
};

export type PaymentWithInvoice = Payment & {
  invoice: Invoice;
  recordedByUser: User;
};

export type RentalRequest = InferSelectModel<typeof rentalRequests>;
export type NewRentalRequest = InferInsertModel<typeof rentalRequests>;
export type RentalRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";