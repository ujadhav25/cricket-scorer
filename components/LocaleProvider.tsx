'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type Locale, type TranslationKey, LOCALES, t as translate } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = 'cric-locale';

export function LocaleProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && LOCALES.some((l) => l.code === stored)) {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    // Also write cookie so server components can read it
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `cric-locale=${l}; path=/; max-age=${oneYear}; samesite=lax`;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: (key) => translate(locale, key) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
