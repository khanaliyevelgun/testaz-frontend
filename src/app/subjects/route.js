import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { createMockSubject, paginateSubjects } from "@/lib/server/mockSubjects";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function GET(request) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();

  const { searchParams } = new URL(request.url);
  return NextResponse.json(paginateSubjects(searchParams.get("page"), searchParams.get("perPage")));
}

export async function POST(request) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();

  const payload = await request.json().catch(() => ({}));
  if (!payload.name) {
    return NextResponse.json({ message: "Subject name is required." }, { status: 400 });
  }

  return NextResponse.json(createMockSubject({ name: payload.name }), { status: 201 });
}
