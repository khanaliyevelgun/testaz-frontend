import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const STATIC_GROUPS = ["common", "public", "auth", "admin", "exam"];
const localesRoot = join(process.cwd(), "src", "locales");

export const staticGroupForKey = (key) => {
  if (/(?:exam|question|quiz|session|subject|topic|result)/i.test(key)) return "exam";
  if (/(?:auth|sign\.in|sign\.up|signin|signup|password|verification|publiconly|roleprotected)/i.test(key)) return "auth";
  if (/^(?:app|components)\.admin\./.test(key)) return "admin";
  if (/^(?:app|components)\./.test(key)) return "public";
  return "common";
};

export const readStaticLocale = async (kind, legacyFilename) => {
  const legacy = legacyFilename
    ? JSON.parse(await readFile(join(localesRoot, legacyFilename), "utf8").catch(() => "{}"))
    : {};
  const grouped = {};
  for (const group of STATIC_GROUPS) {
    const values = JSON.parse(
      await readFile(join(localesRoot, "static", kind, `${group}.json`), "utf8").catch(() => "{}"),
    );
    Object.assign(grouped, values);
  }
  return { ...legacy, ...grouped };
};

export const writeStaticLocale = async (kind, records) => {
  const directory = join(localesRoot, "static", kind);
  await mkdir(directory, { recursive: true });
  const grouped = Object.fromEntries(STATIC_GROUPS.map((group) => [group, {}]));
  Object.entries(records).forEach(([key, value]) => {
    grouped[staticGroupForKey(key)][key] = value;
  });
  await Promise.all(STATIC_GROUPS.map((group) =>
    writeFile(join(directory, `${group}.json`), `${JSON.stringify(grouped[group], null, 2)}\n`, "utf8"),
  ));
};
