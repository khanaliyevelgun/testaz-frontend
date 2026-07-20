"use client";

import { useTranslation } from "@/components/LocaleProvider";

export default function StaticOption({ children, text: textProp, ...props }) {
  const { tx } = useTranslation();
  const content = textProp ?? children;
  const text = typeof content === "string" ? content.replace(/\s+/g, " ").trim() : content;

  return <option {...props}>{typeof text === "string" ? tx(text) : text}</option>;
}
