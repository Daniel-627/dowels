"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  requestId: string;
  propertyId: string;
  tenantId: string;
  moveInDate: string;
  rentAmount: number;
}

export default function CreateBookingButton({
  requestId,
  propertyId,
  tenantId,
  moveInDate,
  rentAmount,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);

    const res = await fetch("/api/landlord/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        propertyId,
        tenantId,
        startDate: moveInDate,
        totalAmount: rentAmount,
      }),
    });

    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="shrink-0 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
    >
      {loading ? "Creating..." : "Create Booking"}
    </button>
  );
}