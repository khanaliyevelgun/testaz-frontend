import { NextResponse } from "next/server";
import { getAuthMockConfig, mockDisabledResponse } from "@/lib/server/authMock";
import { deleteMockSubject, findMockSubject } from "@/lib/server/mockSubjects";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function GET(_request, { params }) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();

  const subject = findMockSubject(params.id);
  if (!subject) return NextResponse.json({ message: "Subject not found" }, { status: 404 });

  return NextResponse.json(subject);
}

export async function DELETE(_request, { params }) {
  const config = getAuthMockConfig();
  if (!config.enabled) return mockDisabledResponse();
  if (!config.grantAuth) return unauthorized();

  if (!deleteMockSubject(params.id)) {
    return NextResponse.json({ message: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Subject deleted successfully." });
}
