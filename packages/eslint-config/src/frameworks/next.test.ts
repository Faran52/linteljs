import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';

import next from './next';
import react from './react';

/**
 * This layer used to wrap `eslint-config-next` and spend most of its lines undoing it: surgery on the upstream flat
 * entries, and a disk read to pin `settings.react.version` so the bundled `eslint-plugin-react` did not throw on
 * ESLint 10. It now registers `@next/eslint-plugin-next` directly, so the tests for all of that went with it. What is
 * left to prove is that the rules a Next project actually had are still the rules it gets.
 */
/**
 * `no-html-link-for-pages` is off here and nowhere else. It looks for a `pages` directory relative to the working
 * directory, and finding none in this repository it writes a paragraph to stderr on every lint below. That is noise
 * about a directory a test fixture is never going to have, not a finding, and none of these tests is about that rule.
 */
const composed = (): ReturnType<typeof base> => {
  return [
    ...base(),
    ...react(),
    ...next(),
    {
      name: 'test/without-a-pages-directory',
      rules: { '@next/next/no-html-link-for-pages': 'off' },
    },
  ];
};

describe('next', () => {
  it('reports a raw <img>, the rule this layer exists for', async () => {
    const code = 'export const Page = () => {\n  return <img src="/a.png" alt="a" />;\n};\n';
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('@next/next/no-img-element');
  });

  // `core-web-vitals`, not `recommended`: the extra rules are the point of the preset upstream pointed projects at.
  it('carries the whole core-web-vitals set', () => {
    const rules = Object.keys(next()[0]?.rules ?? {}).filter(startsWith('@next/next/'));

    expect(rules).toHaveLength(22);
  });

  /**
   * Accessibility is a property of JSX, not of Next, so it is `react()` that enables it. All this layer adds is the one
   * thing about it that really is Next's: `next/image` renders an `img`.
   */
  it('adds only the next/image mapping on top of the accessibility react() enables', () => {
    const a11y = Object.keys(next()[0]?.rules ?? {}).filter((rule) => {
      return rule.startsWith('jsx-a11y/');
    });

    expect(a11y).toEqual(['jsx-a11y/alt-text']);
  });

  it('reports an unsupported aria attribute through those rules', async () => {
    const code = 'export const Page = () => {\n  return <div aria-nonsense="x">a</div>;\n};\n';
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('jsx-a11y/aria-props');
  });

  // `next/image` renders an `img`, so `alt-text` has to know about it or every `<Image>` reads as missing alt text.
  it('tells alt-text about next/image', () => {
    expect(next()[0]?.rules?.['jsx-a11y/alt-text']).toEqual(['error', {
      elements: ['img'],
      img: ['Image'],
    }]);
  });

  // Nothing but Next: what a React project gets, a Next project gets by stacking, not by this layer restating it.
  it('registers only the next plugin', () => {
    expect(next().flatMap((entry) => {
      return Object.keys(entry.plugins ?? {});
    })).toEqual(['@next/next']);
  });

  /**
   * The three plugins the replaced config bundled, none of which is in the tree now: `base()` and `react()` cover the
   * same ground with `import-x`, `@eslint-react` and `react-hooks` v7. Each of the three also stopped its own `eslint`
   * peer range at 9, so this is what took three peer allowances out of the workspace.
   */
  it('registers none of the plugins the replaced config bundled', () => {
    const registered = next().flatMap((entry) => {
      return Object.keys(entry.plugins ?? {});
    });

    expect(registered).not.toContain('react');
    expect(registered).not.toContain('react-hooks');
    expect(registered).not.toContain('import');
  });

  it('reports an unresolved import through import-x rather than eslint-plugin-import', async () => {
    const code = "import { missing } from './nowhere';\n\nexport const value = missing;\n";
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/page.tsx');

    expect(ruleIds).not.toContain('import/no-unresolved');
    expect(ruleIds).toContain('import-x/no-unresolved');
  });

  // Structural, not behavioural: pnpm resolves one `@typescript-eslint/eslint-plugin` instance here, so the
  // collision this guards against cannot be reproduced; in a consumer's tree they are two copies and it throws.
  it('registers no @typescript-eslint plugin of its own', () => {
    const registrations = next().filter((entry) => {
      return entry.plugins !== undefined && '@typescript-eslint' in entry.plugins;
    });

    expect(registrations).toEqual([]);
  });

  // No parser of its own either: it no longer inherits one from upstream, so `base()` is what points `.tsx` at a
  // parser and this layer must not claim the extensions for a different one.
  it('claims no parser', () => {
    const parsers = next().filter((entry) => {
      return entry.languageOptions?.['parser'] !== undefined;
    });

    expect(parsers).toEqual([]);
  });
});
