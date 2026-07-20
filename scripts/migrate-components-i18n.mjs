import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const parser = require("next/dist/compiled/babel/parser");
const projectRoot = process.cwd();
const sourceRoot = join(projectRoot, "src");
const roots = [join(sourceRoot, "components"), join(sourceRoot, "app")];
const extensions = new Set([".js", ".jsx"]);
const excludedFiles = new Set([
  "components/LocaleProvider.jsx",
  "components/LanguageSwitcher.jsx",
  "components/StaticOption.jsx",
  "components/StaticText.jsx",
]);
const excludedParents = new Set(["option", "staticoption", "script", "style", "textarea", "title"]);
const dryRun = process.argv.includes("--dry-run");

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

const jsxName = (name) => {
  if (!name) return "";
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") return jsxName(name.property);
  return "";
};

const isVisibleText = (value) => /[\p{L}\p{N}]/u.test(value);

const renderedLiterals = (expression) => {
  if (!expression) return [];
  if (expression.type === "StringLiteral") return [{ node: expression, text: expression.value }];
  if (expression.type === "TemplateLiteral" && expression.expressions.length === 0) {
    return [{ node: expression, text: expression.quasis[0]?.value?.cooked || "" }];
  }
  if (expression.type === "ConditionalExpression") {
    return [
      ...renderedLiterals(expression.consequent),
      ...renderedLiterals(expression.alternate),
    ];
  }
  if (expression.type === "LogicalExpression") {
    return [
      ...renderedLiterals(expression.left),
      ...renderedLiterals(expression.right),
    ];
  }
  if (expression.type === "ParenthesizedExpression") return renderedLiterals(expression.expression);
  return [];
};

const addImports = (source, ast, importLines) => {
  const missingImports = importLines.filter((importLine) => !source.includes(importLine));
  if (!missingImports.length) return source;
  const imports = ast.program.body.filter((node) => node.type === "ImportDeclaration");
  const directives = ast.program.directives || [];
  const insertionPoint = imports.at(-1)?.end || directives.at(-1)?.end || 0;
  const prefix = insertionPoint ? "\n" : "";
  return `${source.slice(0, insertionPoint)}${prefix}${missingImports.join("\n")}\n${source.slice(insertionPoint)}`;
};

const transform = (source, filename) => {
  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["jsx", "dynamicImport", "optionalChaining", "classProperties", "topLevelAwait"],
  });
  const replacements = [];
  let textCount = 0;
  let optionCount = 0;

  const visit = (node, parent = null) => {
    if (!node || typeof node !== "object") return;
    if (
      node.type === "JSXExpressionContainer" &&
      (parent?.type === "JSXElement" || parent?.type === "JSXFragment") &&
      !["statictext", "staticoption"].includes(jsxName(parent?.openingElement?.name).toLowerCase())
    ) {
      renderedLiterals(node.expression).forEach(({ node: literal, text }) => {
        const normalized = text.replace(/\s+/g, " ").trim();
        if (!normalized || !isVisibleText(normalized)) return;
        replacements.push({
          start: literal.start,
          end: literal.end,
          value: `<StaticText text={${JSON.stringify(normalized)}} />`,
        });
        textCount += 1;
      });
    }
    if (node.type === "JSXElement" && jsxName(node.openingElement?.name).toLowerCase() === "option") {
      const text = node.children
        .filter((child) => child.type === "JSXText")
        .map((child) => child.value)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const hasNonTextChildren = node.children.some((child) => child.type !== "JSXText");
      if (text && isVisibleText(text) && !hasNonTextChildren && node.closingElement) {
        replacements.push(
          {
            start: node.openingElement.name.start,
            end: node.openingElement.name.end,
            value: "StaticOption",
          },
          {
            start: node.closingElement.name.start,
            end: node.closingElement.name.end,
            value: "StaticOption",
          },
        );
        optionCount += 1;
      }
    }
    if (node.type === "JSXText" && parent?.type === "JSXElement") {
      const parentName = jsxName(parent.openingElement?.name).toLowerCase();
      const normalized = node.value.replace(/\s+/g, " ").trim();
      if (
        normalized &&
        isVisibleText(normalized) &&
        !excludedParents.has(parentName) &&
        parentName !== "statictext"
      ) {
        const leading = node.value.match(/^\s*/)?.[0] || "";
        const trailing = node.value.match(/\s*$/)?.[0] || "";
        replacements.push({
          start: node.start,
          end: node.end,
          value: `${leading}<StaticText text={${JSON.stringify(normalized)}} />${trailing}`,
        });
        textCount += 1;
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach((child) => visit(child, node));
      else if (value && typeof value === "object" && typeof value.type === "string") visit(value, node);
    }
  };

  visit(ast);
  if (!replacements.length) return { source, count: 0 };
  let output = source;
  replacements
    .sort((first, second) => second.start - first.start)
    .forEach(({ start, end, value }) => {
      output = `${output.slice(0, start)}${value}${output.slice(end)}`;
    });
  const imports = [];
  if (textCount) imports.push('import StaticText from "@/components/StaticText";');
  if (optionCount) imports.push('import StaticOption from "@/components/StaticOption";');
  output = addImports(output, parser.parse(output, {
    sourceType: "module",
    plugins: ["jsx", "dynamicImport", "optionalChaining", "classProperties", "topLevelAwait"],
  }), imports);
  return { source: output, count: textCount + optionCount, filename };
};

const files = (await Promise.all(roots.map(filesIn))).flat();
let changedFiles = 0;
let changedTexts = 0;

for (const file of files) {
  const relativePath = relative(sourceRoot, file).replace(/\\/g, "/");
  if (excludedFiles.has(relativePath)) continue;
  const source = await readFile(file, "utf8");
  const result = transform(source, relativePath);
  if (!result.count) continue;
  changedFiles += 1;
  changedTexts += result.count;
  if (!dryRun) await writeFile(file, result.source, "utf8");
}

console.log(`${dryRun ? "Would migrate" : "Migrated"} ${changedTexts} JSX texts in ${changedFiles} files.`);
