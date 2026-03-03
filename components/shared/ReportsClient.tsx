"use client";

import { useState } from "react";

interface Payment {
  id: string;
  amount: string;
  method: string | null;
  paidAt: Date;
  tenantName: string | null;
  tenantEmail: string | null;
  propertyTitle: string | null;
  invoiceType: string | null;
  invoicePeriod: string | null;
}

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: string;
  date: string;
  description: string | null;
  propertyTitle: string | null;
}

interface Invoice {
  id: string;
  type: string;
  amount: string;
  status: string;
  dueDate: string;
  period: string | null;
  tenantName: string | null;
  propertyTitle: string | null;
}

interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface Props {
  data: {
    payments: Payment[];
    expenses: Expense[];
    invoices: Invoice[];
    summary: Summary;
  };
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function downloadPDF(
  title: string,
  headers: string[],
  rows: string[][],
  summary?: { label: string; value: string }[]
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Dowels", 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(title, 14, 30);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-KE", {
      day: "numeric", month: "long", year: "numeric",
    })}`,
    14,
    38
  );
  doc.setTextColor(0);

  let startY = 50;
  if (summary) {
    summary.forEach((item, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(item.label + ":", 14, startY + i * 8);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, 90, startY + i * 8);
    });
    startY += summary.length * 8 + 10;
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
}

type LoadingKey =
  | "payments-csv" | "payments-pdf"
  | "expenses-csv" | "expenses-pdf"
  | "invoices-csv" | "invoices-pdf"
  | "balance-pdf"
  | null;

export default function ReportsClient({ data }: Props) {
  const [loading, setLoading] = useState<LoadingKey>(null);

  // Derived figures
  const rentRevenue = data.payments
    .filter((p) => p.invoiceType === "RENT")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const utilityRevenue = data.payments
    .filter((p) => p.invoiceType === "UTILITY")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const otherRevenue = data.payments
    .filter((p) => p.invoiceType === "OTHER" || !p.invoiceType)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const maintenanceExpenses = data.expenses
    .filter((e) => e.category === "MAINTENANCE")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const utilitiesExpenses = data.expenses
    .filter((e) => e.category === "UTILITIES")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const insuranceExpenses = data.expenses
    .filter((e) => e.category === "INSURANCE")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const otherExpenses = data.expenses
    .filter((e) => e.category === "OTHER")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const unpaidInvoices = data.invoices
    .filter((i) => i.status === "UNPAID" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  async function handleExport(
    type: "payments" | "expenses" | "invoices",
    format: "csv" | "pdf"
  ) {
    const key = `${type}-${format}` as LoadingKey;
    setLoading(key);

    try {
      if (type === "payments") {
        const headers = ["Tenant", "Email", "Property", "Type", "Period", "Method", "Amount (KES)", "Date"];
        const rows = data.payments.map((p) => [
          p.tenantName ?? "",
          p.tenantEmail ?? "",
          p.propertyTitle ?? "",
          p.invoiceType ?? "",
          p.invoicePeriod ?? "",
          p.method ?? "",
          Number(p.amount).toLocaleString(),
          new Date(p.paidAt).toLocaleDateString("en-KE"),
        ]);
        format === "csv"
          ? downloadCSV("payments.csv", rows, headers)
          : await downloadPDF("Payments Report", headers, rows, [
              { label: "Rent Collected", value: `KES ${rentRevenue.toLocaleString()}` },
              { label: "Utility Collected", value: `KES ${utilityRevenue.toLocaleString()}` },
              { label: "Other", value: `KES ${otherRevenue.toLocaleString()}` },
              { label: "Total", value: `KES ${data.summary.totalRevenue.toLocaleString()}` },
            ]);
      }

      if (type === "expenses") {
        const headers = ["Property", "Title", "Category", "Amount (KES)", "Date", "Description"];
        const rows = data.expenses.map((e) => [
          e.propertyTitle ?? "",
          e.title,
          e.category,
          Number(e.amount).toLocaleString(),
          new Date(e.date).toLocaleDateString("en-KE"),
          e.description ?? "",
        ]);
        format === "csv"
          ? downloadCSV("expenses.csv", rows, headers)
          : await downloadPDF("Expenses Report", headers, rows, [
              { label: "Maintenance", value: `KES ${maintenanceExpenses.toLocaleString()}` },
              { label: "Utilities", value: `KES ${utilitiesExpenses.toLocaleString()}` },
              { label: "Insurance", value: `KES ${insuranceExpenses.toLocaleString()}` },
              { label: "Other", value: `KES ${otherExpenses.toLocaleString()}` },
              { label: "Total", value: `KES ${data.summary.totalExpenses.toLocaleString()}` },
            ]);
      }

      if (type === "invoices") {
        const headers = ["Tenant", "Property", "Type", "Period", "Amount (KES)", "Due Date", "Status"];
        const rows = data.invoices.map((i) => [
          i.tenantName ?? "",
          i.propertyTitle ?? "",
          i.type,
          i.period ?? "",
          Number(i.amount).toLocaleString(),
          new Date(i.dueDate).toLocaleDateString("en-KE"),
          i.status,
        ]);
        format === "csv"
          ? downloadCSV("invoices.csv", rows, headers)
          : await downloadPDF("Invoices Report", headers, rows, [
              { label: "Outstanding Balance", value: `KES ${unpaidInvoices.toLocaleString()}` },
            ]);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleBalanceSheet() {
    setLoading("balance-pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Dowels", 14, 20);
      doc.setFontSize(13);
      doc.text("Financial Balance Sheet", 14, 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-KE", {
          day: "numeric", month: "long", year: "numeric",
        })}`,
        14,
        38
      );
      doc.setTextColor(0);

      const colWidth = (pageWidth - 28) / 2;
      const leftX = 14;
      const rightX = 14 + colWidth + 4;
      const startY = 50;

      // Left column header — INCOME
      doc.setFillColor(17, 24, 39);
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.rect(leftX, startY, colWidth, 8, "F");
      doc.text("INCOME", leftX + 3, startY + 5.5);

      // Right column header — EXPENSES
      doc.rect(rightX, startY, colWidth, 8, "F");
      doc.text("EXPENSES", rightX + 3, startY + 5.5);
      doc.setTextColor(0);

      // Left column — Income rows
      const incomeRows = [
        ["Rent Collected", `KES ${rentRevenue.toLocaleString()}`],
        ["Utility Collected", `KES ${utilityRevenue.toLocaleString()}`],
        ["Other Income", `KES ${otherRevenue.toLocaleString()}`],
      ];

      // Right column — Expense rows
      const expenseRows = [
        ["Maintenance", `KES ${maintenanceExpenses.toLocaleString()}`],
        ["Utilities", `KES ${utilitiesExpenses.toLocaleString()}`],
        ["Insurance", `KES ${insuranceExpenses.toLocaleString()}`],
        ["Other", `KES ${otherExpenses.toLocaleString()}`],
      ];

      // Draw income table
      autoTable(doc, {
        head: [],
        body: incomeRows,
        startY: startY + 9,
        margin: { left: leftX, right: pageWidth - leftX - colWidth },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: colWidth * 0.6 },
          1: { cellWidth: colWidth * 0.4, halign: "right" },
        },
      });

      const incomeTableEnd = (doc as any).lastAutoTable.finalY;

      // Income total
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(134, 239, 172);
      doc.rect(leftX, incomeTableEnd, colWidth, 9, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(22, 101, 52);
      doc.text("Total Income", leftX + 3, incomeTableEnd + 6);
      doc.text(
        `KES ${data.summary.totalRevenue.toLocaleString()}`,
        leftX + colWidth - 3,
        incomeTableEnd + 6,
        { align: "right" }
      );
      doc.setTextColor(0);

      // Draw expense table
      autoTable(doc, {
        head: [],
        body: expenseRows,
        startY: startY + 9,
        margin: { left: rightX, right: 14 },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: colWidth * 0.6 },
          1: { cellWidth: colWidth * 0.4, halign: "right" },
        },
      });

      const expenseTableEnd = (doc as any).lastAutoTable.finalY;

      // Expense total
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(252, 165, 165);
      doc.rect(rightX, expenseTableEnd, colWidth, 9, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(153, 27, 27);
      doc.text("Total Expenses", rightX + 3, expenseTableEnd + 6);
      doc.text(
        `KES ${data.summary.totalExpenses.toLocaleString()}`,
        rightX + colWidth - 3,
        expenseTableEnd + 6,
        { align: "right" }
      );
      doc.setTextColor(0);

      // Net Income row at bottom
      const netY = Math.max(incomeTableEnd, expenseTableEnd) + 16;
      const isPositive = data.summary.netIncome >= 0;

      doc.setFillColor(isPositive ? 17 : 153, isPositive ? 24 : 27, isPositive ? 39 : 27);
      doc.rect(leftX, netY, pageWidth - 28, 11, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255);
      doc.text("Net Income", leftX + 3, netY + 7.5);
      doc.text(
        `KES ${data.summary.netIncome.toLocaleString()}`,
        pageWidth - 14,
        netY + 7.5,
        { align: "right" }
      );

      doc.save(`balance-sheet-${Date.now()}.pdf`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">

      {/* Balance Sheet — Primary Report */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1">Balance Sheet</h2>
            <p className="text-sm text-gray-400 mb-6">
              Two-column income vs expenses breakdown with net income.
            </p>

            {/* 2-column balance display */}
            <div className="grid grid-cols-2 gap-4">

              {/* Income column */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Income
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Rent</span>
                    <span className="font-medium">KES {rentRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Utilities</span>
                    <span className="font-medium">KES {utilityRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Other</span>
                    <span className="font-medium">KES {otherRevenue.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                    <span className="font-semibold text-green-400">Total</span>
                    <span className="font-bold text-green-400">
                      KES {data.summary.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses column */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Expenses
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Maintenance</span>
                    <span className="font-medium">KES {maintenanceExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Utilities</span>
                    <span className="font-medium">KES {utilitiesExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Insurance</span>
                    <span className="font-medium">KES {insuranceExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Other</span>
                    <span className="font-medium">KES {otherExpenses.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                    <span className="font-semibold text-red-400">Total</span>
                    <span className="font-bold text-red-400">
                      KES {data.summary.totalExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net income */}
            <div className={`mt-4 rounded-xl p-4 flex items-center justify-between ${
              data.summary.netIncome >= 0 ? "bg-green-500/10" : "bg-red-500/10"
            }`}>
              <span className="text-sm font-semibold">Net Income</span>
              <span className={`text-xl font-bold ${
                data.summary.netIncome >= 0 ? "text-green-400" : "text-red-400"
              }`}>
                KES {data.summary.netIncome.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Export button */}
          <div className="shrink-0 sm:self-start">
            <button
              onClick={handleBalanceSheet}
              disabled={loading !== null}
              className="w-full sm:w-auto px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
            >
              {loading === "balance-pdf" ? "Generating..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Individual reports */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Detailed Reports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Payments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💳</span>
              <h3 className="font-semibold text-gray-900 text-sm">Payments</h3>
            </div>
            <p className="text-xs text-gray-500 mb-1">All recorded payments</p>
            <p className="text-xs font-medium text-gray-700 mb-4">
              {data.payments.length} record{data.payments.length === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("payments", "csv")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {loading === "payments-csv" ? "..." : "CSV"}
              </button>
              <button
                onClick={() => handleExport("payments", "pdf")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                {loading === "payments-pdf" ? "..." : "PDF"}
              </button>
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🧾</span>
              <h3 className="font-semibold text-gray-900 text-sm">Invoices</h3>
            </div>
            <p className="text-xs text-gray-500 mb-1">All invoices with status</p>
            <p className="text-xs font-medium text-gray-700 mb-4">
              {data.invoices.length} record{data.invoices.length === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("invoices", "csv")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {loading === "invoices-csv" ? "..." : "CSV"}
              </button>
              <button
                onClick={() => handleExport("invoices", "pdf")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                {loading === "invoices-pdf" ? "..." : "PDF"}
              </button>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💸</span>
              <h3 className="font-semibold text-gray-900 text-sm">Expenses</h3>
            </div>
            <p className="text-xs text-gray-500 mb-1">All logged expenses</p>
            <p className="text-xs font-medium text-gray-700 mb-4">
              {data.expenses.length} record{data.expenses.length === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport("expenses", "csv")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {loading === "expenses-csv" ? "..." : "CSV"}
              </button>
              <button
                onClick={() => handleExport("expenses", "pdf")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                {loading === "expenses-pdf" ? "..." : "PDF"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}