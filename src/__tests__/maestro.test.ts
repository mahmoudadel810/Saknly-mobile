import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { en } from '@/i18n/en';

// The Maestro flows (.maestro/) find things by their on-screen text. They need an emulator, so
// they can't run in CI here; this keeps them honest when copy changes by checking that every
// label a flow taps or asserts still exists in the English strings.
const flowsDir = path.join(process.cwd(), '.maestro');

const strings = new Set<string>();
const collect = (value: unknown) => {
  if (typeof value === 'string') strings.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
};
collect(en);

// Texts a flow builds from what it typed, and tab names that come from `tabs.*`.
const COMPOSED = new Set(['You: hello']);

const labelsIn = (file: string): string[] =>
  readFileSync(path.join(flowsDir, file), 'utf8')
    .split('\n')
    .map(
      (line) =>
        line.match(
          /^\s*(?:- )?(?:tapOn|assertVisible|assertNotVisible|text|visible):\s*["'](.*)["']\s*$/,
        )?.[1],
    )
    .filter((label): label is string => !!label)
    // A pattern (".*") is matched by Maestro, not looked up in the strings.
    .filter((label) => !label.includes('.*'));

describe('Maestro flows', () => {
  const files = readdirSync(flowsDir).filter((name) => name.endsWith('.yaml'));

  it('exist', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s only uses labels the app shows', (file) => {
    const labels = labelsIn(file);
    expect(labels.length).toBeGreaterThan(0);
    const missing = labels.filter((label) => !strings.has(label) && !COMPOSED.has(label));
    expect(missing).toEqual([]);
  });
});
