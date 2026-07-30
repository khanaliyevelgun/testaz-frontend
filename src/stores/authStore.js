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
// The access cookie must not outlive the JWT inside it (backend `jwt.access-token-ttl: 15m`).
// A longer cookie leaves a window where every /admin/** request ships an already-expired token,
// costing middleware an extra fetchMe -> refresh -> fetchMe round-trip (and a bounce to /sign-in if
// the refresh token is stale too). Keep this in sync with the backend TTL.
const authCookieMaxAge = 15 * 60;
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

// localStorage key used only as a cross-tab signal: writing it fires a `storage`
// event in OTHER tabs, letting them adopt a freshly-rotated access token instead of
// each independently refreshing (which would race the same pre-rotation refresh
// token and trip the backend's reuse detection → whole-family revoke → logout).
const ACCESS_TOKEN_SIGNAL_KEY = "eduall.accessToken";

export const setAuthState = (partialState) => {
  if (Object.prototype.hasOwnProperty.call(partialState, "accessToken")) {
    if (partialState.accessToken) {
      setCookie("accessToken", partialState.accessToken);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACCESS_TOKEN_SIGNAL_KEY, partialState.accessToken);
      }
    } else {
      clearCookie("accessToken");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACCESS_TOKEN_SIGNAL_KEY);
      }
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
    window.localStorage.removeItem(ACCESS_TOKEN_SIGNAL_KEY);
  }
  clearCookie("accessToken");
  clearCookie("refreshToken");

  authState = {
    ...initialState,
    isInitialized: true,
  };
  emitChange();
};

/**
 * Adopt an access token that another tab just rotated (delivered via a `storage`
 * event on ACCESS_TOKEN_SIGNAL_KEY). Updates the in-memory access token WITHOUT
 * re-persisting (the writing tab already persisted it) so this tab uses the fresh
 * token and does not run its own `/auth/refresh` — the core of the cross-tab guard.
 * A no-op if the token is unchanged or empty.
 */
export const adoptAccessTokenFromOtherTab = (accessToken) => {
  if (!accessToken || accessToken === authState.accessToken) return;
  setCookie("accessToken", accessToken);
  authState = {
    ...authState,
    accessToken,
    isAuthenticated: true,
  };
  emitChange();
};

export const ACCESS_TOKEN_STORAGE_KEY = ACCESS_TOKEN_SIGNAL_KEY;

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

  // Cross-tab guard: when another tab rotates the access token, adopt it here
  // instead of independently refreshing (which would race the shared refresh token
  // and trip the backend's reuse detection). Also mirror a cross-tab sign-out.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onStorage = (event) => {
      if (event.key === ACCESS_TOKEN_STORAGE_KEY) {
        if (event.newValue) {
          adoptAccessTokenFromOtherTab(event.newValue);
        }
        return;
      }
      // Another tab cleared the refresh token (logout / refresh failure) — mirror it.
      if (event.key === "refreshToken" && event.newValue === null && getAuthState().accessToken) {
        clearAuthState();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
