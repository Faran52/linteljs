import { ruleIdsFor, startsWith } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';

import next from './next';
import react from './react';

// `no-html-link-for-pages` off: it writes a paragraph to stderr on every lint when no `pages/` directory exists.
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

  it('carries the whole core-web-vitals set', () => {
    const rules = Object.keys(next()[0]?.rules ?? {}).filter(startsWith('@next/next/'));

    expect(rules).toHaveLength(22);
  });

  it('adds only the next/image mapping on top of the accessibility react() enables', () => {
    const a11y = Object.keys(next()[0]?.rules ?? {}).filter((rule) => {
      return rule.startsWith('jsx-a11y-x/');
    });

    expect(a11y).toEqual(['jsx-a11y-x/alt-text']);
  });

  it('reports an unsupported aria attribute through those rules', async () => {
    const code = 'export const Page = () => {\n  return <div aria-nonsense="x">a</div>;\n};\n';
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/aria-props');
  });

  it('tells alt-text about next/image', () => {
    expect(next()[0]?.rules?.['jsx-a11y-x/alt-text']).toEqual(['error', {
      elements: ['img'],
      img: ['Image'],
    }]);
  });

  it('registers only the next plugin', () => {
    expect(next().flatMap((entry) => {
      return Object.keys(entry.plugins ?? {});
    })).toEqual(['@next/next']);
  });

  // Each of the three stopped its `eslint` peer range at 9; dropping them took three peer allowances out.
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

  // Structural: pnpm dedupes the plugin here, so the "Cannot redefine plugin" a consumer would hit is not reproducible.
  it('registers no @typescript-eslint plugin of its own', () => {
    const registrations = next().filter((entry) => {
      return entry.plugins !== undefined && '@typescript-eslint' in entry.plugins;
    });

    expect(registrations).toEqual([]);
  });

  it('claims no parser', () => {
    const parsers = next().filter((entry) => {
      return entry.languageOptions?.['parser'] !== undefined;
    });

    expect(parsers).toEqual([]);
  });
});
