"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  propertyId: string;
  isPublished: boolean;
}

export default function PublishToggle({ propertyId, isPublished }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(isPublished);

  async function handleToggle() {
    setLoading(true);

    const res = await fetch("/api/admin/properties/publish", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, isPublished: !published }),
    });

    setLoading(false);

    if (res.ok) {
      setPublished(!published);
      router.refresh();
    }
  }

  return (
    <button title={published ? "Unpublish Property" : "Publish Property"}
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
        published ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        published ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}