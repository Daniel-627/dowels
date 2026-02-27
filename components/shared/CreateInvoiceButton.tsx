"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  bookingId: z.string().uuid("Please select a booking"),
  type: z.enum(["RENT", "UTILITY", "OTHER"]),
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
  period: z.string().optional(),
});

interface Booking {
  id: string;
  tenantName: string | null;
  propertyTitle: string | null;
  totalAmount: string;
}

export default function CreateInvoiceButton({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    bookingId: "",
    type: "RENT",
    amount: "",
    dueDate: "",
    period: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // Auto-fill amount when booking selected and type is RENT
    if (e.target.name === "bookingId") {
      const booking = bookings.find((b) => b.id === e.target.value);
      if (booking && form.type === "RENT") {
        setForm((prev) => ({
          ...prev,
          bookingId: e.target.value,
          amount: booking.totalAmount,
        }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/landlord/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    setOpen(false);
    setForm({ bookingId: "", type: "RENT", amount: "", dueDate: "", period: "" });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition"
      >
        + Create Invoice
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              Create Invoice
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Booking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking
                </label>
                {bookings.length === 0 ? (
                  <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">
                    No active bookings found.
                  </p>
                ) : (
                  <select
                    title="Booking"
                    name="bookingId"
                    value={form.bookingId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                    required
                  >
                    <option value="">Select a booking</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.tenantName} — {b.propertyTitle}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Type
                </label>
                <select
                  title="Invoice Type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                >
                  <option value="RENT">Rent</option>
                  <option value="UTILITY">Utility</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (KES)
                </label>
                <input
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 45000"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                  required
                />
              </div>

              {/* Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period <span className="text-gray-400 font-normal">(e.g. 2026-03)</span>
                </label>
                <input
                  title="Period"
                  name="period"
                  type="month"
                  value={form.period}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  title="Due Date"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
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
                  disabled={loading || bookings.length === 0}
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Invoice"}
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