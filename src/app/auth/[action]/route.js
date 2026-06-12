import { NextResponse } from "next/server";
import {
  getAuthMockConfig,
  mockAccessToken,
  mockDisabledResponse,
  shouldMockError,
} from "@/lib/server/authMock";

export const dynamic = "force-dynamic";

const successResponse = (config, message) =>
  NextResponse.json({
    accessToken: mockAccessToken(config.role),
    user: config.user,
    message,
  });

const unauthorizedResponse = () =>
  NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function GET(_request, { params }) {
  const config = getAuthMockConfig();
  const action = params.action;

  if (!config.enabled) return mockDisabledResponse();

  if (action === "profile") {
    if (!config.grantAuth || shouldMockError(config, "profile")) {
      return unauthorizedResponse();
    }

    return NextResponse.json(config.user);
  }

  return NextResponse.json({ message: "Not found" }, { status: 404 });
}

export async function POST(request, { params }) {
  const config = getAuthMockConfig();
  const action = params.action;

  if (!config.enabled) return mockDisabledResponse();

  if (shouldMockError(config, action)) {
    return NextResponse.json({ message: `Mock ${action} error.` }, { status: 400 });
  }

  switch (action) {
    case "login":
      if (!config.grantAuth) return unauthorizedResponse();
      return successResponse(config, "Mock login successful.");
    case "register":
      if (!config.grantAuth) return unauthorizedResponse();
      return successResponse(config, "Mock registration successful.");
    case "refresh":
      if (!config.grantAuth) return unauthorizedResponse();
      return NextResponse.json({ accessToken: mockAccessToken(config.role) });
    case "logout":
      return new NextResponse(null, { status: 204 });
    case "forgot-password": {
      const payload = await request.json().catch(() => ({}));
      return NextResponse.json({
        message: `Mock reset link sent${payload.email ? ` to ${payload.email}` : ""}.`,
      });
    }
    case "reset-password":
      return NextResponse.json({ message: "Mock password reset successful." });
    default:
      return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
