import { useTranslation } from 'react-i18next';

import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

export type PageSection = { title: string; paragraphs: string[]; bullets: string[] };
export type FaqItem = { question: string; answer: string };

export interface Pages {
  about: { title: string; intro: string; sections: PageSection[]; browse: string };
  faq: { title: string; intro: string; items: FaqItem[]; moreTitle: string; moreBody: string };
  privacy: { title: string; updated: string; sections: PageSection[] };
}

// Both language files must satisfy the same shape (an empty `[]` in Arabic would otherwise be
// inferred as never[] and quietly differ from English).
export const arPages: Pages = ar.pages;
export const enPages: Pages = en.pages;

/**
 * The long-form copy of the About, FAQ and privacy screens. It is read straight from the
 * language files rather than through `t()`, which would turn lists of objects into untyped values.
 */
export function usePages(): Pages {
  const { i18n } = useTranslation();
  return i18n.language === 'en' ? enPages : arPages;
}
