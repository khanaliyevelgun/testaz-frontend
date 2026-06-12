import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { createMockTopic, findMockSubject, paginateTopics } from "@/lib/server/mockSubjects";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function GET(request, { params }) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();
  if (!findMockSubject(params.id)) return NextResponse.json({ message: "Subject not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  return NextResponse.json(paginateTopics(params.id, searchParams.get("page"), searchParams.get("perPage")));
}

export async function POST(request, { params }) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();

  const payload = await request.json().catch(() => ({}));
  if (!payload.name) return NextResponse.json({ message: "Topic name is required." }, { status: 400 });

  const topic = createMockTopic(params.id, { name: payload.name });
  if (!topic) return NextResponse.json({ message: "Subject not found" }, { status: 404 });

  return NextResponse.json(topic, { status: 201 });
}
