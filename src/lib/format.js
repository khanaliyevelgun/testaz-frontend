// Shared formatting helpers. These were previously copy-pasted (as local `formatDate`)
// across ~15 admin/dashboard components; consolidated here so the wording/format is
// consistent and defined once. Output is unchanged from the previous implementations
// for any valid date value.

const AZ_LOCALE = "az-AZ";

/**
 * Localized date + short time, e.g. "19 iyul 2026, 08:56".
 * Returns "-" for a missing or unparseable value.
 */
export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(AZ_LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

/**
 * Localized date only, e.g. "19 iyul 2026".
 * Returns "-" for a missing or unparseable value.
 */
export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(AZ_LOCALE, { dateStyle: "medium" }).format(date);
};
