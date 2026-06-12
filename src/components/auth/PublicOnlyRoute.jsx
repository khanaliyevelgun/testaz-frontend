"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function PublicOnlyRoute({ children, redirectTo = "/", redirectDelayMs = 0 }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const next = searchParams.get("next");
    const target = next?.startsWith("/") ? next : redirectTo;
    const timer = window.setTimeout(() => {
      router.replace(target);
    }, redirectDelayMs);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, isInitialized, redirectDelayMs, redirectTo, router, searchParams]);

  if (isInitialized && isAuthenticated) {
    return null;
  }

  return children;
}
