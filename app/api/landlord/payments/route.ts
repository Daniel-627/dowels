import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, invoices } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, sum } from "drizzle-orm";
import { z } from "zod";
import { recordPaymentJournal } from "@/lib/accounting";

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

    // Get invoice
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parsed.data.invoiceId))
      .limit(1);

    if (!invoice[0]) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

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

    

      // After recording the payment.
      await recordPaymentJournal({
        amount: parsed.data.amount,
        invoiceType: invoice[0].type as "RENT" | "UTILITY" | "OTHER",
        createdBy: session.user.id,
        description: `Payment recorded for invoice ${parsed.data.invoiceId}`,
      });

    // Calculate total paid so far
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

    return NextResponse.json({ success: true, data: payment[0] }, { status: 201 });

  } catch (err) {
    console.error("[record payment]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}