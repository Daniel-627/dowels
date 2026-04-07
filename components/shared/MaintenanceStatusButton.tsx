"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  requestId: string;
  currentStatus: string;
}

const nextStatus: Record<string, string> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: "OPEN",
};

const buttonLabels: Record<string, string> = {
  OPEN: "Mark In Progress",
  IN_PROGRESS: "Mark Resolved",
  RESOLVED: "Reopen",
};

const buttonStyles: Record<string, string> = {
  OPEN: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
  IN_PROGRESS: "bg-green-50 text-green-700 hover:bg-green-100",
  RESOLVED: "bg-gray-50 text-gray-700 hover:bg-gray-100",
};

export default function MaintenanceStatusButton({ requestId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);

    const res = await fetch(`/api/landlord/maintenance/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus[currentStatus] }),
    });

    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleUpdate}
      disabled={loading}
      className={`shrink-0 text-xs font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 ${buttonStyles[currentStatus]}`}
    >
      {loading ? "Updating..." : buttonLabels[currentStatus]}
    </button>
  );
}