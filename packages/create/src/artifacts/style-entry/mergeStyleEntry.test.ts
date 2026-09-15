import {
  describe,
  expect,
  it,
} from 'vitest';

import { mergeStyleEntry, TAILWIND_IMPORT } from './mergeStyleEntry';

describe('mergeStyleEntry', () => {
  // Svelte's case: there is no stylesheet on disk, so this is the whole file.
  it('writes the import alone when there is no stylesheet yet', () => {
    expect(mergeStyleEntry(null)).toBe(`${TAILWIND_IMPORT}\n`);
  });

  it('prepends the import to a stylesheet the scaffolder wrote', () => {
    expect(mergeStyleEntry(':root {\n  color: red;\n}\n')).toBe(
      `${TAILWIND_IMPORT}\n\n:root {\n  color: red;\n}\n`,
    );
  });

  // create-next-app --tailwind writes the line itself, so the merge has to be a no-op there.
  it('leaves a stylesheet that already imports tailwind untouched', () => {
    const current = `${TAILWIND_IMPORT}\n\n:root {\n  color: red;\n}\n`;

    expect(mergeStyleEntry(current)).toBe(current);
  });

  it('recognises the other quoting a project may have used', () => {
    const current = "@import 'tailwindcss';\n";

    expect(mergeStyleEntry(current)).toBe(current);
  });

  // Applied twice is applied once: `sync` re-runs this on every project it touches.
  it('is idempotent', () => {
    const once = mergeStyleEntry('body { margin: 0; }\n');

    expect(mergeStyleEntry(once)).toBe(once);
  });
});

// A real entry read `@import url("tailwindcss") source(none)`; unrecognised, a second unrestricted import went in.
describe('an entry that already imports tailwind another way', () => {
  it.each([
    ['the url form', '@import url("tailwindcss");\n'],
    ['the url form with a source restriction', '@import url("tailwindcss") source(none);\n'],
    ['single quotes inside url', "@import url('tailwindcss');\n"],
  ])('leaves %s alone', (_label, current) => {
    expect(mergeStyleEntry(current)).toBe(current);
  });
});

// NativeWind's entry imports Tailwind by subpath, so the detector has to read those as an import too.
describe('a target with its own import block', () => {
  const NATIVE = ['@import "tailwindcss/theme.css" layer(theme);', '@import "nativewind/theme";'];

  it('writes the block it was given', () => {
    expect(mergeStyleEntry(null, NATIVE)).toBe(`${NATIVE.join('\n')}\n`);
  });

  it('is idempotent on a subpath import', () => {
    const once = mergeStyleEntry('.a { color: red; }\n', NATIVE);

    expect(mergeStyleEntry(once, NATIVE)).toBe(once);
  });
});
