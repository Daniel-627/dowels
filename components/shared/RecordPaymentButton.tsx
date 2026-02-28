"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  invoiceId: string;
  balance: number;
}

export default function RecordPaymentButton({ invoiceId, balance }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    amount: String(balance),
    method: "CASH",
    paidAt: new Date().toISOString().split("T")[0],
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/landlord/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceId,
        amount: parseFloat(form.amount),
        method: form.method,
        paidAt: form.paidAt,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
      >
        + Record Payment
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              Record Payment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KES)
                </label>
                <input
                  title="Amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  max={balance}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Balance due: KES {balance.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  title="Payment Method"
                  name="method"
                  value={form.method}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  title="Payment Date"
                  name="paidAt"
                  type="date"
                  value={form.paidAt}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}