import az from "@/locales/az.json";
import en from "@/locales/en.json";
import { staticAz, staticEn, staticSource } from "@/locales/static";

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

const MESSAGE_FIELDS = ["message", "error", "detail", "title"];

/**
 * Only presentation fields are localized; names, enums, roles and other data
 * values are never changed. We localize the known message fields (`message`,
 * `error`, `detail`, `title`, `errors`) wherever they appear in the response
 * tree, but we only recurse structurally into objects — we never translate a
 * bare string that merely happens to sit in some other field. Blindly mapping
 * every nested string through `translateApiMessage` would rewrite enum-like
 * values such as a user's `roles: ["STUDENT"]` into a fallback error string.
 */
export const localizeApiResponse = (value, locale = activeLocale) => {
  if (typeof value === "string") return translateApiMessage(value, "api.unknownKey", locale);
  if (Array.isArray(value)) return value.map((item) => localizeStructure(item, locale));
  return localizeStructure(value, locale);
};

const localizeStructure = (value, locale) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => localizeStructure(item, locale));

  const result = { ...value };

  MESSAGE_FIELDS.forEach((field) => {
    if (typeof result[field] === "string") {
      result[field] = translateApiMessage(result[field], "api.unknownKey", locale);
    }
  });

  if (Array.isArray(result.errors)) {
    result.errors = result.errors.map((error) =>
      typeof error === "string"
        ? translateApiMessage(error, "api.validation", locale)
        : localizeStructure(error, locale)
    );
  }

  Object.entries(result).forEach(([field, item]) => {
    if (field !== "errors" && item && typeof item === "object") {
      result[field] = localizeStructure(item, locale);
    }
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
