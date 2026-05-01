import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Lang = "ar" | "en";

export type Bilingual = { ar: string; en: string };

type LanguageContextValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (entry: Bilingual) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "salam-journey:lang";

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "ar";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // ignore storage errors
  }
  return "ar";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
    html.classList.toggle("lang-ar", lang === "ar");
    html.classList.toggle("lang-en", lang === "en");
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    window.location.reload();
  }, []);

  const toggle = useCallback(() => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    window.location.reload();
  }, [lang]);

  const t = useCallback(
    (entry: Bilingual) => entry[lang],
    [lang],
  );

  const value: LanguageContextValue = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang,
    toggle,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

/** Helper to define a bilingual string inline. */
export const tx = (ar: string, en: string): Bilingual => ({ ar, en });
