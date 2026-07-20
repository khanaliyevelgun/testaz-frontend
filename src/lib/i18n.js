import az from "@/locales/az.json";
import en from "@/locales/en.json";
import staticAz from "@/locales/static.az.json";
import staticEn from "@/locales/static.en.json";
import staticSource from "@/locales/static.source.json";

export const DEFAULT_LOCALE = "az";
export const SUPPORTED_LOCALES = ["az", "en"];
const dictionaries = { az, en };
let activeLocale = DEFAULT_LOCALE;
const staticFallbackTranslations = {
  az: {
    "Bloq": "Bloq",
  },
  en: {
    "Planlar": "Plans",
    "Naviqasiya": "Navigation",
    "Bloq": "Blog",
    "Yeni imtahan yarat": "Create new exam",
    "İmtahan yarat": "Create exam",
    "Sil": "Delete",
    "Daxil ol": "Sign in",
    "Qeydiyyat": "Sign up",
  },
};

export const setActiveLocale = (locale) => {
  activeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
};

const readPath = (object, path) =>
  String(path || "").split(".").filter(Boolean).reduce(
    (value, part) => (value && typeof value === "object" ? value[part] : undefined),
    object
  );

const interpolate = (value, params) =>
  typeof value === "string"
    ? value.replace(/{{\s*([\w.-]+)\s*}}/g, (_, name) => String(params?.[name] ?? ""))
    : value;

export const getDictionary = (locale = activeLocale) => dictionaries[locale] || dictionaries[DEFAULT_LOCALE];

export const translate = (key, params, locale = activeLocale) => {
  const value = readPath(getDictionary(locale), key) ?? readPath(getDictionary(DEFAULT_LOCALE), key);
  return typeof value === "string" ? interpolate(value, params) : key;
};

const normalizeMessageKey = (value) => String(value || "").trim()
  .replace(/([a-z])([A-Z])/g, "$1_$2").replace(/[.\s/-]+/g, "_")
  .replace(/[^\w_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "").toLowerCase();

const looksLikeTranslationKey = (value) => /^[a-z][\w.-]+$/i.test(String(value || "").trim())
  && (/[._]/.test(value) || /^[A-Z0-9_]+$/.test(value));

/** API message keys are never displayed directly to the user. */
export const translateApiMessage = (value, fallback = "api.unknownKey", locale = activeLocale) => {
  if (typeof value !== "string" || !value.trim()) return translate(fallback, undefined, locale);
  const raw = value.trim();
  const candidates = [raw, `api.${raw}`, `api.codes.${raw}`, `api.codes.${normalizeMessageKey(raw)}`];
  const match = candidates.map((candidate) => readPath(getDictionary(locale), candidate)).find((item) => typeof item === "string");
  if (match) return match;
  return looksLikeTranslationKey(raw) ? translate(fallback, undefined, locale) : raw;
};

/** Only presentation fields are localized; names and other user content are not changed. */
export const localizeApiResponse = (value, locale = activeLocale) => {
  if (typeof value === "string") return translateApiMessage(value, "api.unknownKey", locale);
  if (Array.isArray(value)) return value.map((item) => localizeApiResponse(item, locale));
  if (!value || typeof value !== "object") return value;
  const result = { ...value };
  ["message", "error", "detail", "title"].forEach((field) => {
    if (typeof result[field] === "string") result[field] = translateApiMessage(result[field], "api.unknownKey", locale);
  });
  if (Array.isArray(result.errors)) {
    result.errors = result.errors.map((error) => typeof error === "string"
      ? translateApiMessage(error, "api.validation", locale)
      : localizeApiResponse(error, locale));
  }
  Object.entries(result).forEach(([field, item]) => {
    if (field !== "errors" && item && typeof item === "object") result[field] = localizeApiResponse(item, locale);
  });
  return result;
};

const flatten = (object, prefix = "", output = {}) => {
  Object.entries(object || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, path, output);
    else output[path] = value;
  });
  return output;
};

/** Maps legacy static English template labels to their locale equivalent. */
export const getStaticTextTranslations = (locale = activeLocale) => {
  const english = flatten(en.static);
  const translated = flatten(getDictionary(locale).static);
  const legacyTranslations = Object.entries(english).reduce((map, [key, source]) => {
    if (typeof source === "string" && typeof translated[key] === "string") map[source] = translated[key];
    return map;
  }, {});
  const fileTranslations = locale === "en" ? staticEn : staticAz;
  return Object.entries(staticSource).reduce((map, [key, source]) => {
    const translatedFromFile = fileTranslations[key];
    const translatedValue =
      staticFallbackTranslations[locale]?.[source] ||
      (translatedFromFile && translatedFromFile !== source ? translatedFromFile : null) ||
      source;
    if (typeof source === "string" && typeof translatedValue === "string") {
      map[source] = translatedValue;
    }
    return map;
  }, legacyTranslations);
};
