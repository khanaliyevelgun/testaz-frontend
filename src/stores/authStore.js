"use client";

import { createContext, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

const initialState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
};

let authState = initialState;
const listeners = new Set();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const getAuthState = () => authState;
export const getAccessToken = () => authState.accessToken;

export const setAuthState = (partialState) => {
  authState = {
    ...authState,
    ...partialState,
    isAuthenticated: Boolean(partialState.accessToken ?? authState.accessToken),
  };
  emitChange();
};

export const setAccessToken = (accessToken) => {
  setAuthState({ accessToken });
};

export const setUser = (user) => {
  setAuthState({ user });
};

export const clearAuthState = () => {
  authState = {
    ...initialState,
    isInitialized: true,
  };
  emitChange();
};

export const subscribeAuthStore = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useAuthSnapshot = () =>
  useSyncExternalStore(subscribeAuthStore, getAuthState, getAuthState);

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const snapshot = useAuthSnapshot();
  const router = useRouter();
  const pathname = usePathname();

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") return;
    const next = encodeURIComponent(`${pathname || "/"}${window.location.search || ""}`);
    router.replace(`/sign-in?next=${next}`);
  }, [pathname, router]);

  const value = useMemo(
    () => ({
      ...snapshot,
      redirectToLogin,
    }),
    [redirectToLogin, snapshot]
  );

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setAuthState({ isLoading: true });

      try {
        const { refreshAccessToken, fetchProfile } = await import("@/lib/api");
        const accessToken = await refreshAccessToken();

        if (!isMounted) return;

        if (accessToken) {
          const user = await fetchProfile();
          if (isMounted) {
            setAuthState({
              accessToken,
              user,
              isInitialized: true,
              isLoading: false,
            });
          }
          return;
        }
      } catch {
        // Keep startup failures quiet; unauthenticated state is valid.
      }

      if (isMounted) {
        clearAuthState();
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
