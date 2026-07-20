"use client";

import { useTranslation } from "@/components/LocaleProvider";

export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale } = useTranslation();

  return (
    <select
      aria-label='Dil seçin'
      className={`form-select form-select-sm border-neutral-40 text-13 ${className}`}
      value={locale}
      onChange={(event) => setLocale(event.target.value)}
    >
      <option value='az'>AZ</option>
      <option value='en'>EN</option>
    </select>
  );
}
