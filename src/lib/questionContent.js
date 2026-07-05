const allowedTextTags = new Set(["b", "strong", "i", "em", "u", "sup", "sub", "br", "p", "ul", "ol", "li"]);

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeAttribute = (value = "") => escapeHtml(value).replace(/`/g, "&#96;");

const isSafeMediaUrl = (value = "") => {
  const url = String(value).trim();
  return /^https?:\/\//i.test(url) || url.startsWith("/");
};

export const sanitizeQuestionHtml = (value = "") =>
  String(value)
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(\/?)\s*([a-z0-9]+)([^>]*)>/gi, (match, closing, tagName, attributes = "") => {
      const tag = tagName.toLowerCase();

      if (tag === "img" && !closing) {
        const src = attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || "";
        if (!isSafeMediaUrl(src)) return "";
        const alt = attributes.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] || "";
        return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" />`;
      }

      if (!allowedTextTags.has(tag)) return "";
      if (tag === "br") return "<br />";
      return closing ? `</${tag}>` : `<${tag}>`;
    });

export const renderQuestionHtml = (value = "") => ({
  __html: sanitizeQuestionHtml(value),
});

export const questionHtmlToText = (value = "") =>
  String(value)
    .replace(/<\s*img\b[^>]*>/gi, " [image] ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const insertHtmlAtSelection = (element, currentValue, snippet) => {
  if (!element) return `${currentValue}${snippet}`;

  const start = element.selectionStart ?? currentValue.length;
  const end = element.selectionEnd ?? currentValue.length;
  const selected = currentValue.slice(start, end);
  return `${currentValue.slice(0, start)}${snippet(selected)}${currentValue.slice(end)}`;
};
