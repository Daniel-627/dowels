"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EndBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleEnd() {
    setLoading(true);

    const res = await fetch("/api/landlord/bookings/end", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/dashboard/landlord/bookings");
      router.refresh();
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
      >
        End Tenancy
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Are you sure?</span>
      <button
        onClick={handleEnd}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
      >
        {loading ? "Ending..." : "Yes, End Tenancy"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        Cancel
      </button>
    </div>
  );
}