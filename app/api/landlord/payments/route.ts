import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, invoices, bookings, properties, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, sum } from "drizzle-orm";
import { z } from "zod";
import { recordPaymentJournal } from "@/lib/accounting";
import { sendPaymentConfirmationEmail } from "@/lib/email";

const schema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "MPESA", "OTHER"]),
  paidAt: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "LANDLORD") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.issues[0].message,
      }, { status: 400 });
    }

    // Get invoice with tenant and property details
    const invoice = await db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        type: invoices.type,
        tenantName: users.name,
        tenantEmail: users.email,
        propertyTitle: properties.title,
      })
      .from(invoices)
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .leftJoin(users, eq(bookings.tenantId, users.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(invoices.id, parsed.data.invoiceId))
      .limit(1);

    if (!invoice[0]) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const { tenantName, tenantEmail, propertyTitle } = invoice[0];

    // Record payment
    const payment = await db
      .insert(payments)
      .values({
        invoiceId: parsed.data.invoiceId,
        amount: String(parsed.data.amount),
        method: parsed.data.method,
        paidAt: new Date(parsed.data.paidAt),
        recordedBy: session.user.id,
      })
      .returning();

    // Journal entry
    await recordPaymentJournal({
      amount: parsed.data.amount,
      invoiceType: invoice[0].type as "RENT" | "UTILITY" | "OTHER",
      createdBy: session.user.id,
      description: `Payment recorded for invoice ${parsed.data.invoiceId}`,
    });

    // Calculate total paid
    const totalPaidResult = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.invoiceId, parsed.data.invoiceId));

    const totalPaid = Number(totalPaidResult[0]?.total ?? 0);
    const invoiceAmount = Number(invoice[0].amount);

    // Update invoice status
    let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
    if (totalPaid >= invoiceAmount) {
      newStatus = "PAID";
    } else if (totalPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    }

    await db
      .update(invoices)
      .set({ status: newStatus })
      .where(eq(invoices.id, parsed.data.invoiceId));

    // Send confirmation email to tenant
    if (tenantEmail && tenantName && propertyTitle) {
      await sendPaymentConfirmationEmail({
        to: tenantEmail,
        tenantName,
        propertyTitle,
        amount: parsed.data.amount,
        method: parsed.data.method,
        paidAt: parsed.data.paidAt,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, data: payment[0] }, { status: 201 });

  } catch (err) {
    console.error("[record payment]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}