// i18n/LanguageProvider.tsx
// Global locale state: persisted to localStorage, applied to the document
// <html lang> + dir, and exposed via useLanguage() -> { locale, setLocale, t }.
//
// RTL handling: any locale flagged rtl=true in translations.ts gets
// <html dir="rtl"> automatically, so Tailwind logical margin/padding
// utilities (ms-/me-/text-start/text-end) and the sidebar/topbar layout
// flip direction without extra plumbing per page.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { dictionaries, LOCALES, type Dictionary, type Locale } from './translations';

const STORAGE_KEY = 'farmerai.locale';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // Accept string so components can pass dynamic keys (e.g. template-driven
  // labelKeys) without TS2322 errors. Unknown keys fall back to the raw key.
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return value !== null && value in dictionaries;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Default locale is Somali ('so') per the Figma spec. A previously
    // persisted choice wins over the default, so returning users keep
    // their language across visits.
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(saved) ? saved : 'so';
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    const meta = LOCALES.find((l) => l.code === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta?.rtl ? 'rtl' : 'ltr';
  }, [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) =>
        dictionaries[locale][key as keyof Dictionary] ?? key,
    }),
    [locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
  return ctx;
}