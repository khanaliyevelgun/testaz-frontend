"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, getStaticTextTranslations, setActiveLocale, SUPPORTED_LOCALES, translate } from "@/lib/i18n";

const LocaleContext = createContext({ locale: DEFAULT_LOCALE, setLocale: () => {}, t: (key) => key });
const translatableAttributes = ["placeholder", "title", "aria-label", "alt"];
const excludedParents = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);
const originalText = new WeakMap();
const originalAttributes = new WeakMap();

const localizeStaticContent = (root, translations) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!node.parentElement || excludedParents.has(node.parentElement.tagName)) return;
    const original = originalText.get(node) ?? node.nodeValue;
    originalText.set(node, original);
    const trimmed = original.trim();
    if (trimmed && translations[trimmed]) node.nodeValue = original.replace(trimmed, translations[trimmed]);
  });
  root.querySelectorAll(translatableAttributes.map((attribute) => `[${attribute}]`).join(",")).forEach((element) => {
    translatableAttributes.forEach((attribute) => {
      const original = originalAttributes.get(element) || {};
      const value = original[attribute] ?? element.getAttribute(attribute);
      if (!(attribute in original)) original[attribute] = value;
      originalAttributes.set(element, original);
      if (value) element.setAttribute(attribute, translations[value] || value);
    });
  });
};

export const useTranslation = () => useContext(LocaleContext);

/** Localizes legacy static template JSX. New components should call `t(key)`. */
export default function LocaleProvider({ children }) {
  const [locale, updateLocale] = useState(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);
  const setLocale = useCallback((nextLocale) => {
    const next = SUPPORTED_LOCALES.includes(nextLocale) ? nextLocale : DEFAULT_LOCALE;
    setActiveLocale(next);
    updateLocale(next);
    window.localStorage.setItem("eduall.locale", next);
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: (key, params) => translate(key, params, locale) }), [locale, setLocale]);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("eduall.locale");
    const initialLocale = SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : DEFAULT_LOCALE;
    setActiveLocale(initialLocale);
    updateLocale(initialLocale);
    setIsHydrated(true);
  }, [setLocale]);

  useEffect(() => {
    if (!isHydrated) return undefined;
    const translations = getStaticTextTranslations(locale);
    const root = document.body;
    document.documentElement.lang = locale;
    let observer;
    const timeout = window.setTimeout(() => {
      localizeStaticContent(root, translations);
      observer = new MutationObserver(() => localizeStaticContent(root, translations));
      observer.observe(root, { childList: true, subtree: true });
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [isHydrated, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
