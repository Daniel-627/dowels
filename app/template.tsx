"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/shared/PageLoader";

export default function Template({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;
  return <>{children}</>;
}