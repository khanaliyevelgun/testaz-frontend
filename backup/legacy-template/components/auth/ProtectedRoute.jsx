"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, fallback = null }) {
  const { isAuthenticated, isInitialized, redirectToLogin } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      redirectToLogin();
    }
  }, [isAuthenticated, isInitialized, redirectToLogin]);

  if (!isInitialized || !isAuthenticated) {
    return fallback;
  }

  return children;
}
