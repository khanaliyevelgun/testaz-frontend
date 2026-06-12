import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { deleteMockUser, findMockUser } from "@/lib/server/mockUsers";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const config = getAuthMockConfig();

  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = findMockUser(params.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function DELETE(_request, { params }) {
  const config = getAuthMockConfig();

  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!deleteMockUser(params.id)) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "User deleted successfully." });
}
