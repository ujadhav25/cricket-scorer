import { cookies } from 'next/headers';
import { type Locale, type TranslationKey, translations, LOCALES } from '@/lib/i18n';

export function getServerLocale(): Locale {
  const val = cookies().get('cric-locale')?.value as Locale | undefined;
  if (val && LOCALES.some((l) => l.code === val)) return val;
  return 'en';
}

/** Use in server components: const t = serverT() */
export function serverT() {
  const locale = getServerLocale();
  return (key: TranslationKey): string =>
    translations[locale]?.[key] ?? translations.en[key] ?? key;
}
