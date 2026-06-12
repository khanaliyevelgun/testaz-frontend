import { clearAuthState, getAccessToken, setAccessToken } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

let refreshPromise = null;

const isAuthEndpoint = (url) =>
  url.endsWith("/auth/login") ||
  url.endsWith("/auth/register") ||
  url.endsWith("/auth/reset-password") ||
  url.endsWith("/auth/refresh") ||
  url.endsWith("/auth/logout");

const buildUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const data = await parseResponse(response);

        if (!response.ok) {
          throw new ApiError("Unauthorized", response.status, data);
        }

        const accessToken = data?.accessToken;
        if (!accessToken) {
          throw new ApiError("Refresh response did not include an access token", response.status, data);
        }

        setAccessToken(accessToken);
        return accessToken;
      })
      .catch((error) => {
        clearAuthState();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const { _retry, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const accessToken = getAccessToken();
  const shouldAttachToken = !isAuthEndpoint(url) && accessToken;
  const retry = _retry === true;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (shouldAttachToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !retry && !isAuthEndpoint(url)) {
    try {
      const newAccessToken = await refreshAccessToken();
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      return apiFetch(path, {
        ...fetchOptions,
        headers: retryHeaders,
        _retry: true,
      });
    } catch (error) {
      clearAuthState();
      if (typeof window !== "undefined") {
        window.location.assign("/sign-in");
      }
      throw error;
    }
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const login = (credentials) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const register = (payload) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const logout = () =>
  apiFetch("/auth/logout", {
    method: "POST",
  });

export const forgotPassword = (payload) =>
  apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const resetPassword = (payload) =>
  apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchProfile = () => apiFetch("/auth/profile");

export const fetchNotifications = ({ page = 1, perPage = 10 } = {}) =>
  apiFetch(`/notifications?page=${page}&perPage=${perPage}`);
