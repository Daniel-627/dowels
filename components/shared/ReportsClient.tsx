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

  // Header
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

  // Summary box if provided
  let startY = 50;
  if (summary) {
    summary.forEach((item, i) => {
      doc.setFont("helvetica", "bold");
      doc.text(item.label + ":", 14, startY + i * 8);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, 70, startY + i * 8);
    });
    startY += summary.length * 8 + 10;
  }

  // Table
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

export default function ReportsClient({ data }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExport(
    type: "payments" | "expenses" | "invoices" | "summary",
    format: "csv" | "pdf"
  ) {
    setLoading(`${type}-${format}`);

    try {
      if (type === "payments") {
        const headers = ["Tenant", "Email", "Property", "Invoice Type", "Period", "Method", "Amount (KES)", "Date"];
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

        if (format === "csv") {
          downloadCSV("payments.csv", rows, headers);
        } else {
          await downloadPDF("Payments Report", headers, rows, [
            { label: "Total Revenue", value: `KES ${data.summary.totalRevenue.toLocaleString()}` },
          ]);
        }
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

        if (format === "csv") {
          downloadCSV("expenses.csv", rows, headers);
        } else {
          await downloadPDF("Expenses Report", headers, rows, [
            { label: "Total Expenses", value: `KES ${data.summary.totalExpenses.toLocaleString()}` },
          ]);
        }
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

        if (format === "csv") {
          downloadCSV("invoices.csv", rows, headers);
        } else {
          await downloadPDF("Invoices Report", headers, rows);
        }
      }

      if (type === "summary") {
        const headers = ["Metric", "Amount (KES)"];
        const rows = [
          ["Total Revenue", data.summary.totalRevenue.toLocaleString()],
          ["Total Expenses", data.summary.totalExpenses.toLocaleString()],
          ["Net Income", data.summary.netIncome.toLocaleString()],
          ["Total Payments", data.payments.length.toString()],
          ["Total Invoices", data.invoices.length.toString()],
          ["Total Expenses Logged", data.expenses.length.toString()],
        ];

        if (format === "csv") {
          downloadCSV("summary.csv", rows, headers);
        } else {
          await downloadPDF("Financial Summary", headers, rows);
        }
      }
    } finally {
      setLoading(null);
    }
  }

  const reports = [
    {
      key: "summary" as const,
      title: "Financial Summary",
      description: "Revenue, expenses and net income overview",
      icon: "📊",
      stat: `KES ${data.summary.netIncome.toLocaleString()} net`,
    },
    {
      key: "payments" as const,
      title: "Payments Report",
      description: "All recorded payments with tenant and property details",
      icon: "💳",
      stat: `${data.payments.length} payment${data.payments.length === 1 ? "" : "s"}`,
    },
    {
      key: "invoices" as const,
      title: "Invoices Report",
      description: "All invoices with status and due dates",
      icon: "🧾",
      stat: `${data.invoices.length} invoice${data.invoices.length === 1 ? "" : "s"}`,
    },
    {
      key: "expenses" as const,
      title: "Expenses Report",
      description: "All logged expenses by property and category",
      icon: "💸",
      stat: `${data.expenses.length} expense${data.expenses.length === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <p className="text-xs text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">
            KES {data.summary.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5">
          <p className="text-xs text-red-400">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            KES {data.summary.totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className={`rounded-2xl p-5 ${data.summary.netIncome >= 0 ? "bg-green-50" : "bg-red-50"}`}>
          <p className={`text-xs ${data.summary.netIncome >= 0 ? "text-green-400" : "text-red-400"}`}>
            Net Income
          </p>
          <p className={`text-2xl font-bold mt-1 ${data.summary.netIncome >= 0 ? "text-green-700" : "text-red-700"}`}>
            KES {data.summary.netIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div
            key={report.key}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{report.icon}</span>
                  <h3 className="font-semibold text-gray-900">{report.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{report.description}</p>
                <p className="text-xs font-medium text-gray-700 mt-2">{report.stat}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport(report.key, "csv")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {loading === `${report.key}-csv` ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={() => handleExport(report.key, "pdf")}
                disabled={loading !== null}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                {loading === `${report.key}-pdf` ? "Generating..." : "Export PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}