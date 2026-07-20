import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const workspaceRoot = process.cwd();
const sourceRoot = resolve(workspaceRoot, "src");
const backupRoot = resolve(workspaceRoot, "backup", "legacy-template");
const dryRun = process.argv.includes("--dry-run");
const extensions = [".js", ".jsx", ".json", ".scss"];

const isWithin = (root, target) => target === root || target.startsWith(`${root}\\`) || target.startsWith(`${root}/`);
const isFile = (file) => existsSync(file) && statSync(file).isFile();
const listFiles = (directory, output = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) listFiles(file, output);
    else output.push(file);
  }
  return output;
};

const resolveImport = (from, specifier) => {
  const base = specifier.startsWith("@/")
    ? join(sourceRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(from), specifier)
      : null;
  if (!base) return null;
  if (isFile(base)) return base;
  for (const extension of extensions) if (isFile(`${base}${extension}`)) return `${base}${extension}`;
  for (const extension of extensions) {
    const indexFile = join(base, `index${extension}`);
    if (isFile(indexFile)) return indexFile;
  }
  return null;
};

const activeRoots = [
  "app/layout.jsx", "app/not-found.jsx", "app/loading.js", "app/page.jsx",
  "app/about/page.jsx", "app/contact/page.jsx", "app/pricing-plan/page.jsx",
  "app/faq/page.jsx", "app/blog/page.jsx", "app/sign-in/page.jsx",
  "app/sign-up/page.jsx", "app/forgot-password/page.jsx", "app/reset-password/page.jsx",
  "app/new-password/page.jsx", "app/auth/[action]/page.jsx", "app/api/openapi/route.js",
  "app/openapi.yaml", "middleware.js",
].map((file) => join(sourceRoot, file)).filter(isFile);

for (const directory of ["app/admin", "app/exam", "app/exam-session", "app/sessions"]) {
  const fullPath = join(sourceRoot, directory);
  if (existsSync(fullPath)) activeRoots.push(...listFiles(fullPath));
}

const reachable = new Set();
const queue = [...activeRoots];
while (queue.length) {
  const file = queue.pop();
  if (reachable.has(file)) continue;
  reachable.add(file);
  if (!/\.(js|jsx|json|scss)$/.test(file)) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    const imported = resolveImport(file, match[1]);
    if (imported && !reachable.has(imported)) queue.push(imported);
  }
}

const allPages = listFiles(join(sourceRoot, "app")).filter((file) => file.endsWith("page.jsx"));
const allComponents = listFiles(join(sourceRoot, "components")).filter((file) => /\.(js|jsx)$/.test(file));
const toArchive = [
  ...allPages.filter((file) => !reachable.has(file)),
  ...allComponents.filter((file) => !reachable.has(file)),
].sort();

const relativeFiles = toArchive.map((file) => relative(sourceRoot, file).replaceAll("\\", "/"));
if (dryRun) {
  console.log(JSON.stringify({ count: relativeFiles.length, files: relativeFiles }, null, 2));
  process.exit(0);
}

for (const sourceFile of toArchive) {
  const targetFile = resolve(backupRoot, relative(sourceRoot, sourceFile));
  if (!isWithin(sourceRoot, sourceFile) || !isWithin(backupRoot, targetFile)) throw new Error(`Unsafe archive path: ${sourceFile}`);
  if (existsSync(targetFile)) throw new Error(`Backup target already exists: ${targetFile}`);
  mkdirSync(dirname(targetFile), { recursive: true });
  renameSync(sourceFile, targetFile);
}

writeFileSync(join(backupRoot, "manifest.json"), `${JSON.stringify({ archivedAt: new Date().toISOString(), files: relativeFiles }, null, 2)}\n`, "utf8");
console.log(`Archived ${relativeFiles.length} unused template files in ${relative(workspaceRoot, backupRoot)}.`);
