import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { paginateUsers } from "@/lib/server/mockUsers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const config = getAuthMockConfig();

  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  return NextResponse.json(
    paginateUsers({
      page: searchParams.get("page"),
      perPage: searchParams.get("perPage"),
      search: searchParams.get("search"),
      role: searchParams.get("role"),
    })
  );
}
