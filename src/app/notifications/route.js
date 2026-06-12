import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { getMockNotifications, paginate } from "@/lib/server/mockNotifications";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const config = getAuthMockConfig();

  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const perPage = searchParams.get("perPage");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  return NextResponse.json(paginate(getMockNotifications({ unreadOnly }), page, perPage));
}
