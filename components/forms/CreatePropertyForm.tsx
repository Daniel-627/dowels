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
  landlordId: z.string().uuid("Please select a landlord"),
});

interface Landlord {
  id: string;
  name: string;
  email: string;
}

export default function CreatePropertyForm({ landlords }: { landlords: Landlord[] }) {
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
    landlordId: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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

    const res = await fetch("/api/admin/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
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

    router.push("/dashboard/admin/properties");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Modern 2BR in Westlands"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          required
        />
      </div>

      {/* Description */}
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
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition resize-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="e.g. Westlands, Nairobi"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          required
        />
      </div>

      {/* Rent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES)</label>
        <input
          name="rentAmount"
          type="number"
          value={form.rentAmount}
          onChange={handleChange}
          placeholder="e.g. 45000"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          required
        />
      </div>

      {/* Bedrooms + Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <select
            title="Select number of bedrooms"
            name="bedrooms"
            value={form.bedrooms}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <select
            title="Select number of bathrooms"
            name="bathrooms"
            value={form.bathrooms}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Landlord */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Landlord</label>
        {landlords.length === 0 ? (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">
            No landlords found. Go to Users and promote a tenant to landlord first.
          </p>
        ) : (
          <select
            title="Select Landlord"
            name="landlordId"
            value={form.landlordId}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            required
          >
            <option value="">Select a landlord</option>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || landlords.length === 0}
          className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Property"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}