"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function PublicOnlyRoute({ children, redirectTo = "/" }) {
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : redirectTo);
  }, [isAuthenticated, isInitialized, redirectTo, router, searchParams]);

  if (isInitialized && isAuthenticated) {
    return null;
  }

  return children;
}
