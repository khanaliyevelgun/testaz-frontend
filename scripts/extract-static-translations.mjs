import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const sourceRoot = join(process.cwd(), "src");
const localesRoot = join(sourceRoot, "locales");
const sourceExtensions = new Set([".js", ".jsx"]);
const ignoredDirectories = new Set(["api"]);

const filesIn = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) result.push(...await filesIn(fullPath));
    } else if (sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      result.push(fullPath);
    }
  }
  return result;
};

const hash = (value) => {
  let result = 5381;
  for (const character of value) result = (result * 33) ^ character.charCodeAt(0);
  return (result >>> 0).toString(36);
};

const usefulText = (value) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  const identifier = /^[a-z][a-z0-9_-]*$/i.test(normalized);
  const codeLike = /[{}]|=>|;|&&|\|\||===|!==|\b(?:const|return|import|from|className)\b/.test(normalized);
  return normalized.length > 1 && /[A-Za-zƏəĞğİıÖöŞşÜü]/.test(normalized) && !/^(https?:|\/|#|@\/|&[a-z]+;)/i.test(normalized) && !codeLike && (!identifier || /^[A-ZƏĞİÖŞÜ]/.test(normalized))
    ? normalized
    : null;
};

const extract = (source) => {
  const texts = new Set();
  const add = (value) => {
    const text = usefulText(value);
    if (text) texts.add(text);
  };
  for (const match of source.matchAll(/>([^<>{]+)</g)) add(match[1]);
  for (const match of source.matchAll(/(?:placeholder|title|aria-label|alt)\s*=\s*(['"])(.*?)\1/g)) add(match[2]);
  for (const match of source.matchAll(/(?:setError|setMessage|label|placeholder|title)\s*(?:\(|:)\s*(['"])(.*?)\1/g)) add(match[2]);
  // Conditional JSX values (for example `isLoading ? "Loading..." : "Search"`)
  // are not text nodes, so include their human-facing string literals as well.
  for (const match of source.matchAll(/(['"])([^'"\r\n]+)\1/g)) add(match[2]);
  return [...texts].sort((first, second) => first.localeCompare(second));
};

const existingAz = JSON.parse(await readFile(join(localesRoot, "static.az.json"), "utf8").catch(() => "{}"));
const existingEn = JSON.parse(await readFile(join(localesRoot, "static.en.json"), "utf8").catch(() => "{}"));
const sourceTexts = {};
const english = {};
const azerbaijani = {};
const files = await filesIn(sourceRoot);

for (const file of files) {
  const relativePath = relative(sourceRoot, file).replace(/\\/g, "/");
  const texts = extract(await readFile(file, "utf8"));
  for (const text of texts) {
    const key = `${relativePath.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, ".").replace(/^\.|\.$/g, "")}.${hash(text)}`.toLowerCase();
    sourceTexts[key] = text;
    if (existingEn[key] && existingEn[key] !== text) english[key] = existingEn[key];
    azerbaijani[key] = existingAz[key] || text;
  }
}

await writeFile(join(localesRoot, "static.source.json"), `${JSON.stringify(sourceTexts, null, 2)}\n`, "utf8");
await writeFile(join(localesRoot, "static.en.json"), `${JSON.stringify(english, null, 2)}\n`, "utf8");
await writeFile(join(localesRoot, "static.az.json"), `${JSON.stringify(azerbaijani, null, 2)}\n`, "utf8");
console.log(`${Object.keys(sourceTexts).length} static texts exported to src/locales/static.source.json and static.{en,az}.json`);
