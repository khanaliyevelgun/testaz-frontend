"use client";

import { useTranslation } from "@/components/LocaleProvider";

/**
 * Declarative translation wrapper for visible JSX text.
 * `display: contents` keeps the surrounding component layout unchanged.
 */
export default function StaticText({ text }) {
  const { tx } = useTranslation();

  return (
    <span className='i18n-static-text' data-i18n-managed='true'>
      {tx(text)}
    </span>
  );
}
