"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  location: z.string().min(3, "Location is required"),
  rentAmount: z.string().min(1, "Rent amount is required"),
  bedrooms: z.string().min(1),
  bathrooms: z.string().min(1),
});

export default function LandlordCreatePropertyForm({ landlordId }: { landlordId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    rentAmount: "",
    bedrooms: "1",
    bathrooms: "1",
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

    const res = await fetch("/api/landlord/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        landlordId,
        rentAmount: parseFloat(form.rentAmount),
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error);
      return;
    }

    router.push(`/dashboard/landlord/properties/${data.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 w-full">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Modern 2BR in Westlands"
          className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the property..."
          rows={4}
          className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="e.g. Westlands, Nairobi"
          className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES)</label>
        <input
          name="rentAmount"
          type="number"
          value={form.rentAmount}
          onChange={handleChange}
          placeholder="e.g. 45000"
          className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <select
            title="Bedrooms"
            name="bedrooms"
            value={form.bedrooms}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <select
            title="No of Bathrooms"
            name="bathrooms"
            value={form.bathrooms}
            onChange={handleChange}
            className="w-full px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 sm:px-4 py-2.5 rounded-lg">{error}</p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition text-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Property"}
        </button>
      </div>
    </form>
  );
}