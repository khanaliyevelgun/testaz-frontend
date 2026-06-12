import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  const openApiPath = join(process.cwd(), "openapi.yaml");
  const spec = await readFile(openApiPath, "utf8");

  return new Response(spec, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
