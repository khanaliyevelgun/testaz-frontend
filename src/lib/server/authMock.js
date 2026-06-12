import { NextResponse } from "next/server";

const allowedRoles = ["admin", "parent", "child"];

export const getAuthMockConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const enabled = !isProduction && process.env.AUTH_MOCK_ENABLED === "true";
  const role = String(process.env.AUTH_MOCK_ROLE || "admin").toLowerCase();
  const normalizedRole = allowedRoles.includes(role) ? role : "admin";

  return {
    enabled,
    grantAuth: process.env.AUTH_MOCK_GRANT_AUTH !== "false",
    role: normalizedRole,
    errorMode: String(process.env.AUTH_MOCK_ERROR_MODE || "none").toLowerCase(),
    user: {
      id: process.env.AUTH_MOCK_USER_ID || "mock-user-1",
      name: process.env.AUTH_MOCK_USER_NAME || "Mock Admin",
      email: process.env.AUTH_MOCK_EMAIL || "admin@example.com",
      role: normalizedRole,
      roles: [normalizedRole],
    },
  };
};

export const mockDisabledResponse = () =>
  NextResponse.json({ message: "Auth mock is disabled." }, { status: 404 });

export const shouldMockError = (config, action) =>
  config.errorMode === "all" || config.errorMode === action;

export const mockAccessToken = (role) => `mock-access-token-${role}`;
