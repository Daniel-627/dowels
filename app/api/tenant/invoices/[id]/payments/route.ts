import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, invoices, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Verify this invoice belongs to the tenant
    const invoice = await db
      .select()
      .from(invoices)
      .leftJoin(bookings, eq(invoices.bookingId, bookings.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice[0]) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    // Verify tenant owns this booking
    if (invoice[0].bookings?.tenantId !== session.user.id && session.user.role !== "LANDLORD" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const invoicePayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .where(eq(payments.invoiceId, id))
      .orderBy(payments.paidAt);

    return NextResponse.json({ success: true, payments: invoicePayments });

  } catch (err) {
    console.error("[invoice payments]", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}