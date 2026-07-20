import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { createRequire } from "node:module";
import { readStaticLocale } from "./i18n-static-utils.mjs";

const require = createRequire(import.meta.url);
const parser = require("next/dist/compiled/babel/parser");
const sourceRoot = join(process.cwd(), "src");
const extensions = new Set([".js", ".jsx", ".json", ".scss"]);
const parseableExtensions = new Set([".js", ".jsx"]);
const excludedJsxParents = new Set(["option", "staticoption", "script", "style", "textarea", "title"]);
const issues = [];

const filesIn = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
};

const jsxName = (name) => name?.type === "JSXIdentifier" ? name.name : "";
const hasVisibleText = (value) => /[\p{L}\p{N}]/u.test(value);

const files = await filesIn(sourceRoot);
for (const file of files) {
  const source = await readFile(file, "utf8");
  const displayPath = relative(process.cwd(), file).replace(/\\/g, "/");
  if (source.includes("\uFFFD")) issues.push(`${displayPath}: invalid UTF-8 replacement character`);
  if (/[ÃÂ]|(?:Ä|Å)[^\s]/u.test(source)) issues.push(`${displayPath}: possible mojibake sequence`);
  if (!parseableExtensions.has(extname(file))) continue;

  let ast;
  try {
    ast = parser.parse(source, {
      sourceType: "module",
      plugins: ["jsx", "dynamicImport", "optionalChaining", "classProperties", "topLevelAwait"],
    });
  } catch (error) {
    issues.push(`${displayPath}: parse failed (${error.message})`);
    continue;
  }

  const visit = (node, parent = null, optionDepth = 0) => {
    if (!node || typeof node !== "object") return;
    const currentName = node.type === "JSXElement" ? jsxName(node.openingElement?.name).toLowerCase() : "";
    const nextOptionDepth = optionDepth + (["option", "staticoption"].includes(currentName) ? 1 : 0);
    if (node.type === "JSXElement" && currentName === "statictext" && optionDepth > 0) {
      issues.push(`${displayPath}:${node.loc?.start?.line || 0}: StaticText cannot be nested in an option`);
    }
    if (node.type === "JSXText" && parent?.type === "JSXElement") {
      const parentName = jsxName(parent.openingElement?.name).toLowerCase();
      const text = node.value.replace(/\s+/g, " ").trim();
      if (
        text &&
        hasVisibleText(text) &&
        !excludedJsxParents.has(parentName) &&
        parentName !== "statictext"
      ) {
        issues.push(`${displayPath}:${node.loc?.start?.line || 0}: untranslated JSX text "${text}"`);
      }
    }
    if (
      node.type === "StringLiteral" &&
      /\p{L}\?\p{L}/u.test(node.value) &&
      !/[/?&=][^\s]*=/.test(node.value)
    ) {
      issues.push(`${displayPath}:${node.loc?.start?.line || 0}: suspicious question mark in "${node.value}"`);
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((child) => visit(child, node, nextOptionDepth));
      else if (value && typeof value === "object" && value.type) visit(value, node, nextOptionDepth);
    }
  };
  visit(ast);
}

const sourceTexts = await readStaticLocale("source");
const azerbaijani = await readStaticLocale("az");
const english = await readStaticLocale("en");
Object.keys(sourceTexts).forEach((key) => {
  if (typeof azerbaijani[key] !== "string") issues.push(`Missing Azerbaijani translation: ${key}`);
  if (typeof english[key] !== "string" && typeof sourceTexts[key] !== "string") {
    issues.push(`Missing English source fallback: ${key}`);
  }
});

if (issues.length) {
  console.error(issues.join("\n"));
  console.error(`i18n audit failed with ${issues.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(`i18n audit passed: ${files.length} source files and ${Object.keys(sourceTexts).length} locale entries checked.`);
}
