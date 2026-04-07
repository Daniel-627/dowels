"use client";

import { useState } from "react";

interface Props {
  userId: string;
  currentRole: string;
}

const nextRole: Record<string, string | null> = {
  TENANT: "LANDLORD",
  LANDLORD: "TENANT",
  ADMIN: null,
};

const buttonLabels: Record<string, string> = {
  TENANT: "Promote to Landlord",
  LANDLORD: "Demote to Tenant",
  ADMIN: "—",
};

export default function PromoteUserButton({ userId, currentRole }: Props) {
  const [loading, setLoading] = useState(false);

  if (currentRole === "ADMIN") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  async function handleRoleChange() {
    const target = nextRole[currentRole];
    if (!target) return;

    setLoading(true);

    const res = await fetch("/api/admin/users/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: target }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRoleChange}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
        currentRole === "TENANT"
          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {loading ? "Updating..." : buttonLabels[currentRole]}
    </button>
  );
}