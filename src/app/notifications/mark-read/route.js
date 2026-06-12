import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { markMockNotificationsRead } from "@/lib/server/mockNotifications";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const config = getAuthMockConfig();

  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const ids = Array.isArray(payload.ids) ? payload.ids : [];

  if (!ids.length) {
    return NextResponse.json(
      { message: "Notification ids are required.", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: "Notifications marked as read.",
    ...markMockNotificationsRead(ids),
  });
}
