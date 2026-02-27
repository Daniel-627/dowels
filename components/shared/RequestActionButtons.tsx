"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestActionButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);

    const res = await fetch("/api/admin/requests/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        status: action === "approve" ? "APPROVED" : "REJECTED",
      }),
    });

    setLoading(null);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:w-36 shrink-0">
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      >
        {loading === "approve" ? "..." : "✓ Approve"}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="w-full px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition disabled:opacity-50"
      >
        {loading === "reject" ? "..." : "✕ Reject"}
      </button>
    </div>
  );
}