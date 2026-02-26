"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  moveInDate: z.string().min(1, "Move-in date is required"),
  occupants: z.string().min(1),
  employmentInfo: z.string().min(10, "Please provide some employment details"),
  message: z.string().optional(),
});

interface Props {
  propertyId: string;
  propertyTitle: string;
  rentAmount: number;
}

export default function RequestToRentForm({ propertyId, propertyTitle, rentAmount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    moveInDate: "",
    occupants: "1",
    employmentInfo: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

    const res = await fetch("/api/rental-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        moveInDate: form.moveInDate,
        occupants: parseInt(form.occupants),
        employmentInfo: form.employmentInfo,
        message: form.message,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">
        Request to Rent
      </h2>
      <p className="text-xs text-gray-500 mb-5">
        {propertyTitle} · KES {rentAmount.toLocaleString()}/mo
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Move-in date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Preferred Move-in Date
          </label>
          <input
            title="Preferred Move-in Date"
            name="moveInDate"
            type="date"
            value={form.moveInDate}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            required
          />
        </div>

        {/* Occupants */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Number of Occupants
          </label>
          <select
            title="Number of Occupants"
            name="occupants"
            value={form.occupants}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
            ))}
          </select>
        </div>

        {/* Employment info */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Employment / Income Info
          </label>
          <textarea
            name="employmentInfo"
            value={form.employmentInfo}
            onChange={handleChange}
            placeholder="e.g. Software Engineer at Safaricom, employed for 3 years"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition resize-none"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Message to Landlord{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Anything else you'd like the landlord to know..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>

      </form>
    </div>
  );
}