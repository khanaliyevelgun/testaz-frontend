import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { deleteMockTopic, findMockSubject } from "@/lib/server/mockSubjects";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function DELETE(_request, { params }) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();
  if (!findMockSubject(params.id)) return NextResponse.json({ message: "Subject not found" }, { status: 404 });

  if (!deleteMockTopic(params.id, params.topicId)) {
    return NextResponse.json({ message: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Topic deleted successfully." });
}
