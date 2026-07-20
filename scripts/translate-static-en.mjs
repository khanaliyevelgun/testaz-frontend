import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const localesRoot = join(process.cwd(), "src", "locales");
const sourceTexts = JSON.parse(await readFile(join(localesRoot, "static.source.json"), "utf8"));
const translations = JSON.parse(await readFile(join(localesRoot, "static.en.json"), "utf8").catch(() => "{}"));
const separator = "@@@EDUSINAQ_NEXT@@@";
const maxBatches = Number(process.env.I18N_BATCHES || 0);

const pending = Object.entries(sourceTexts).filter(([key]) => translations[key] === undefined);
const batches = [];
let batch = [];
let size = 0;
for (const entry of pending) {
  const nextSize = entry[1].length + separator.length + 2;
  if (batch.length && size + nextSize > 4200) {
    batches.push(batch);
    batch = [];
    size = 0;
  }
  batch.push(entry);
  size += nextSize;
}
if (batch.length) batches.push(batch);

const translateBatch = async (entries) => {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", "en");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", entries.map(([, source]) => source).join(`\n${separator}\n`));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation request failed (${response.status})`);
  const data = await response.json();
  const values = (data?.[0] || []).map((part) => part[0]).join("").split(separator).map((value) => value.trim());
  if (values.length !== entries.length) throw new Error("Translation response separators were not preserved");
  entries.forEach(([key], index) => { if (values[index]) translations[key] = values[index]; });
};

const selectedBatches = maxBatches > 0 ? batches.slice(0, maxBatches) : batches;
for (const [index, entries] of selectedBatches.entries()) {
  await translateBatch(entries);
  await writeFile(join(localesRoot, "static.en.json"), `${JSON.stringify(translations, null, 2)}\n`, "utf8");
  console.log(`Translated batch ${index + 1}/${selectedBatches.length}`);
  await new Promise((resolve) => setTimeout(resolve, 120));
}
console.log(`${selectedBatches.reduce((total, entries) => total + entries.length, 0)} of ${pending.length} static texts translated to English.`);
