import { NextResponse } from "next/server";
import { getAllowedRolesForPath, normalizeRole, ORGANIZATION_ROLES } from "./src/lib/authRoles";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const API_PREFIX = "/api/v1";

const buildApiUrl = (path) => `${API_BASE_URL}${API_PREFIX}${path}`;

const unwrapApiResponse = (data) => {
  if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "data")) {
    return data.data;
  }

  return data;
};

const getRoles = (user) => {
  const roles = user?.roles || user?.role || user?.type || user?.accountType;
  if (Array.isArray(roles)) return roles.map(normalizeRole);
  if (roles) return [normalizeRole(roles)];
  return [];
};

const fetchJson = async (url, options) => {
  const headers = new Headers(options?.headers || {});

  if (url.includes(".ngrok-free.")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) return null;
  if (response.status === 204) return null;

  return response.json().catch(() => null);
};

const fetchMe = async (accessToken) => {
  if (!accessToken) return null;

  const response = await fetchJson(buildApiUrl("/auth/me"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return unwrapApiResponse(response);
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) return null;

  const response = await fetchJson(buildApiUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  return unwrapApiResponse(response);
};

const redirectToLogin = (request) => {
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const response = NextResponse.redirect(signInUrl);
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
};

export async function middleware(request) {
  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  let user = await fetchMe(accessToken);
  const response = NextResponse.next();

  if (!user && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken);
    accessToken = tokens?.accessToken;

    if (accessToken) {
      response.cookies.set("accessToken", accessToken, {
        path: "/",
        maxAge: 60 * 60,
        sameSite: "lax",
      });

      if (tokens?.refreshToken) {
        response.cookies.set("refreshToken", tokens.refreshToken, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
      }

      user = await fetchMe(accessToken);
    }
  }

  if (!user) {
    return redirectToLogin(request);
  }

  const roles = getRoles(user);
  const allowedRoles = getAllowedRolesForPath(request.nextUrl.pathname).flatMap((role) =>
    role === "organization" ? ORGANIZATION_ROLES : [normalizeRole(role)]
  );
  const isAllowed = allowedRoles.some((role) => roles.includes(role));

  if (!isAllowed) {
    const dashboardRoles = ["admin", "parent", "child", ...ORGANIZATION_ROLES];
    const hasDashboardRole = roles.some((role) => dashboardRoles.includes(role));
    const target = hasDashboardRole && request.nextUrl.pathname !== "/admin" ? "/admin" : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
