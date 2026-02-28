"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  requestId: string;
  currentStatus: string;
}

export default function RequestActionButtons({ requestId, currentStatus }: Props) {
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

  // REJECTED or CANCELLED — no actions
  if (["REJECTED", "CANCELLED"].includes(currentStatus)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:w-40 shrink-0">

      {/* Show Approve only if PENDING */}
      {currentStatus === "PENDING" && (
        <button
          onClick={() => handleAction("approve")}
          disabled={loading !== null}
          className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading === "approve" ? "..." : "Approve"}
        </button>
      )}

      {/* Show Reject for both PENDING and APPROVED */}
      {["PENDING", "APPROVED"].includes(currentStatus) && (
        <button
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          className="w-full px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition disabled:opacity-50"
        >
          {loading === "reject" ? "..." : currentStatus === "APPROVED" ? "Revoke Approval" : "Reject"}
        </button>
      )}

      {/* Show status label for APPROVED */}
      {currentStatus === "APPROVED" && (
        <span className="text-xs text-center text-green-600 font-medium">
          Approved — awaiting booking
        </span>
      )}
    </div>
  );
}