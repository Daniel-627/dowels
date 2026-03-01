"use client";

import { useState, useEffect } from "react";

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  balance: number;
  debit: number;
  credit: number;
}

interface PLData {
  revenue: Account[];
  expenses: Account[];
  assets: Account[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
}

async function downloadPLPDF(data: PLData) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Dowels", 14, 20);

  doc.setFontSize(13);
  doc.text("Profit & Loss Statement", 14, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-KE", {
      day: "numeric", month: "long", year: "numeric",
    })}`,
    14, 38
  );
  doc.setTextColor(0);

  // Revenue table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INCOME", 14, 52);

  autoTable(doc, {
    head: [["Account", "Code", "Amount (KES)"]],
    body: [
      ...data.revenue.map((a) => [a.name, a.code, `KES ${a.balance.toLocaleString()}`]),
      ["", "Total Income", `KES ${data.totalRevenue.toLocaleString()}`],
    ],
    startY: 56,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const revenueEnd = (doc as any).lastAutoTable.finalY + 8;

  // Expenses table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EXPENSES", 14, revenueEnd);

  autoTable(doc, {
    head: [["Account", "Code", "Amount (KES)"]],
    body: [
      ...data.expenses.map((a) => [a.name, a.code, `KES ${a.balance.toLocaleString()}`]),
      ["", "Total Expenses", `KES ${data.totalExpenses.toLocaleString()}`],
    ],
    startY: revenueEnd + 4,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const expenseEnd = (doc as any).lastAutoTable.finalY + 8;

  // Net income
  doc.setFillColor(17, 24, 39);
  doc.rect(14, expenseEnd, 182, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255);
  doc.text("NET INCOME", 17, expenseEnd + 7);
  doc.text(
    `KES ${data.netIncome.toLocaleString()}`,
    196,
    expenseEnd + 7,
    { align: "right" }
  );

  doc.save(`pl-statement-${Date.now()}.pdf`);
}

export default function PLStatement() {
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reports/pl")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error);
      })
      .catch(() => setError("Failed to load P&L data"))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    if (!data) return;
    setExporting(true);
    await downloadPLPDF(data);
    setExporting(false);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-sm text-gray-400">Loading P&L data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
        <p className="text-sm text-red-500">{error || "Failed to load data"}</p>
        <p className="text-xs text-gray-400 mt-1">
          Make sure you have run the accounts seed script.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Profit & Loss Statement
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Based on double-entry journal entries
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
        >
          {exporting ? "Generating..." : "Export PDF"}
        </button>
      </div>

      <div className="p-6 space-y-6">

        {/* Income */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Income
          </p>
          <div className="space-y-2">
            {data.revenue.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between py-2 border-b border-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-700">{account.name}</p>
                  <p className="text-xs text-gray-400">{account.code}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  KES {account.balance.toLocaleString()}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-green-50 rounded-lg px-3">
              <p className="text-sm font-semibold text-green-700">Total Income</p>
              <p className="text-sm font-bold text-green-700">
                KES {data.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Expenses
          </p>
          <div className="space-y-2">
            {data.expenses.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between py-2 border-b border-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-700">{account.name}</p>
                  <p className="text-xs text-gray-400">{account.code}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  KES {account.balance.toLocaleString()}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-red-50 rounded-lg px-3">
              <p className="text-sm font-semibold text-red-700">Total Expenses</p>
              <p className="text-sm font-bold text-red-700">
                KES {data.summary?.totalExpenses.toLocaleString() ?? data.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          data.netIncome >= 0 ? "bg-gray-900" : "bg-red-900"
        }`}>
          <p className="text-sm font-bold text-white">Net Income</p>
          <p className={`text-xl font-bold ${
            data.netIncome >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            KES {data.netIncome.toLocaleString()}
          </p>
        </div>

        {/* Assets */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Assets
          </p>
          <div className="space-y-2">
            {data.assets.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between py-2 border-b border-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-700">{account.name}</p>
                  <p className="text-xs text-gray-400">{account.code}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  KES {account.balance.toLocaleString()}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-blue-50 rounded-lg px-3">
              <p className="text-sm font-semibold text-blue-700">Total Assets (Cash)</p>
              <p className="text-sm font-bold text-blue-700">
                KES {data.totalAssets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}