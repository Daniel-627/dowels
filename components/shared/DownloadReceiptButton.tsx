"use client";

import { useState } from "react";

interface Props {
  invoiceId: string;
  invoiceType: string;
  invoicePeriod: string | null;
  invoiceAmount: number;
  invoiceStatus: string;
  dueDate: string;
  propertyTitle: string | null;
  propertyLocation: string | null;
  tenantName: string;
  tenantEmail: string;
}

export default function DownloadReceiptButton({
  invoiceId,
  invoiceType,
  invoicePeriod,
  invoiceAmount,
  invoiceStatus,
  dueDate,
  propertyTitle,
  propertyLocation,
  tenantName,
  tenantEmail,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);

    try {
      // Fetch payment details for this invoice
      const res = await fetch(`/api/tenant/invoices/${invoiceId}/payments`);
      const data = await res.json();

      if (!data.success) {
        alert("Failed to load invoice details");
        return;
      }

      const payments = data.payments;
      const totalPaid = payments.reduce(
        (sum: number, p: any) => sum + Number(p.amount), 0
      );
      const balance = invoiceAmount - totalPaid;

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header band
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("Dowels", 14, 18);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text("by Dorcas Owela · Rental Management", 14, 28);
      doc.setTextColor(255, 255, 255);
      doc.text("INVOICE RECEIPT", pageWidth - 14, 22, { align: "right" });

      // Invoice meta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Invoice Details", 14, 56);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);

      const meta = [
        ["Invoice Type", invoiceType],
        ["Period", invoicePeriod ?? "—"],
        ["Due Date", new Date(dueDate).toLocaleDateString("en-KE", {
          day: "numeric", month: "long", year: "numeric",
        })],
        ["Status", invoiceStatus.replace("_", " ")],
        ["Generated", new Date().toLocaleDateString("en-KE", {
          day: "numeric", month: "long", year: "numeric",
        })],
      ];

      meta.forEach(([label, value], i) => {
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", 14, 66 + i * 8);
        doc.setFont("helvetica", "normal");
        doc.text(value, 70, 66 + i * 8);
      });

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.line(14, 110, pageWidth - 14, 110);

      // Tenant + Property
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Tenant", 14, 122);
      doc.text("Property", pageWidth / 2 + 10, 122);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(tenantName, 14, 130);
      doc.text(tenantEmail, 14, 138);
      doc.text(propertyTitle ?? "—", pageWidth / 2 + 10, 130);
      doc.text(propertyLocation ?? "—", pageWidth / 2 + 10, 138);

      // Divider
      doc.line(14, 148, pageWidth - 14, 148);

      // Payments table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Payments", 14, 160);

      if (payments.length > 0) {
        autoTable(doc, {
          head: [["Date", "Method", "Amount (KES)"]],
          body: payments.map((p: any) => [
            new Date(p.paidAt).toLocaleDateString("en-KE", {
              day: "numeric", month: "short", year: "numeric",
            }),
            p.method,
            Number(p.amount).toLocaleString(),
          ]),
          startY: 165,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [17, 24, 39], textColor: 255 },
          alternateRowStyles: { fillColor: [249, 250, 251] },
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("No payments recorded yet.", 14, 170);
      }

      const tableEnd = payments.length > 0
        ? (doc as any).lastAutoTable.finalY + 10
        : 180;

      // Summary box
      const summaryY = tableEnd + 5;
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.rect(14, summaryY, pageWidth - 28, 36, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Invoice Amount:", 20, summaryY + 10);
      doc.text(`KES ${invoiceAmount.toLocaleString()}`, pageWidth - 20, summaryY + 10, { align: "right" });

      doc.text("Total Paid:", 20, summaryY + 20);
      doc.setTextColor(22, 101, 52);
      doc.text(`KES ${totalPaid.toLocaleString()}`, pageWidth - 20, summaryY + 20, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(balance > 0 ? 153 : 22, balance > 0 ? 27 : 101, balance > 0 ? 27 : 52);
      doc.text("Balance Due:", 20, summaryY + 32);
      doc.text(`KES ${balance.toLocaleString()}`, pageWidth - 20, summaryY + 32, { align: "right" });

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(
        "This is a system-generated receipt from Dowels by OpenDoor.",
        pageWidth / 2,
        285,
        { align: "center" }
      );

      doc.save(`receipt-${invoiceType.toLowerCase()}-${invoicePeriod ?? invoiceId.slice(0, 8)}.pdf`);

    } catch (err) {
      console.error(err);
      alert("Failed to generate receipt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
    >
      {loading ? (
        "..."
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Receipt
        </>
      )}
    </button>
  );
}