import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

import { arPages, enPages, type Pages } from './usePages';

// The language files are typed against each other, but TypeScript can't tell that a list in
// English has as many entries as the Arabic one. A page that is shorter in one language is a bug.
describe('page content', () => {
  it('has the same shape in Arabic and English', () => {
    const shape = (pages: Pages) => ({
      about: pages.about.sections.map((s) => [s.paragraphs.length, s.bullets.length]),
      faq: pages.faq.items.length,
      privacy: pages.privacy.sections.map((s) => [s.paragraphs.length, s.bullets.length]),
    });
    expect(shape(enPages)).toEqual(shape(arPages));
    expect(en.chat.suggestions).toHaveLength(ar.chat.suggestions.length);
  });

  it('has no empty text', () => {
    for (const pages of [arPages, enPages]) {
      const texts = [
        ...pages.about.sections.flatMap((s) => [s.title, ...s.paragraphs, ...s.bullets]),
        ...pages.faq.items.flatMap((i) => [i.question, i.answer]),
        ...pages.privacy.sections.flatMap((s) => [s.title, ...s.paragraphs, ...s.bullets]),
      ];
      expect(texts.length).toBeGreaterThan(0);
      expect(texts.every((text) => text.trim().length > 0)).toBe(true);
    }
  });
});
