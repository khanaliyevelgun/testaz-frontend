"use client";

import { createContext, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
};

let authState = initialState;
const listeners = new Set();
const authCookieMaxAge = 60 * 60;
const refreshCookieMaxAge = 60 * 60 * 24 * 7;

const setCookie = (name, value, maxAge = authCookieMaxAge) => {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};

const clearCookie = (name) => {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const getCookie = (name) => {
  if (typeof document === "undefined") return null;

  return (
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.split("=")[1] || null
  );
};

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const getAuthState = () => authState;
export const getAccessToken = () => authState.accessToken;
export const getRefreshToken = () => {
  if (authState.refreshToken) return authState.refreshToken;
  if (typeof window === "undefined") return null;
  const cookieRefreshToken = getCookie("refreshToken");
  return cookieRefreshToken ? decodeURIComponent(cookieRefreshToken) : window.localStorage.getItem("refreshToken");
};

export const setAuthState = (partialState) => {
  if (Object.prototype.hasOwnProperty.call(partialState, "accessToken")) {
    if (partialState.accessToken) {
      setCookie("accessToken", partialState.accessToken);
    } else {
      clearCookie("accessToken");
    }
  }

  if (Object.prototype.hasOwnProperty.call(partialState, "refreshToken") && typeof window !== "undefined") {
    if (partialState.refreshToken) {
      window.localStorage.setItem("refreshToken", partialState.refreshToken);
      setCookie("refreshToken", partialState.refreshToken, refreshCookieMaxAge);
    } else {
      window.localStorage.removeItem("refreshToken");
      clearCookie("refreshToken");
    }
  }

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

export const setTokens = ({ accessToken, refreshToken }) => {
  setAuthState({ accessToken, refreshToken });
};

export const setUser = (user) => {
  setAuthState({ user });
};

export const clearAuthState = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("refreshToken");
  }
  clearCookie("accessToken");
  clearCookie("refreshToken");

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
