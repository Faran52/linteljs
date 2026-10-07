import {
  NEXT_PROJECT,
  ownBlockNames,
  ruleIdsFor,
  sortsAheadOfPackages,
  startsWith,
} from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import react from '../react/reactFramework';

import next, { nextGroup } from './nextFramework';

const FILENAME_RULE = 'check-file/filename-naming-convention';

const composed = (): ReturnType<typeof base> => {
  const layers = [
    ...base(),
    ...react(),
    ...next(),
    ...NEXT_PROJECT,
  ];
  return layers;
};

describe('next', () => {
  it('reports a raw <img>, the rule this layer exists for', async () => {
    const code = 'export const Page = () => {\n  return <img src="/a.png" alt="a" />;\n};\n';
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('@next/next/no-img-element');
  });

  it('carries the whole core-web-vitals set', () => {
    const rules = Object.keys(next()[0]?.rules ?? {})
      .filter(startsWith('@next/next/'));

    expect(rules).toHaveLength(22);
  });

  it('reports a raw <a> to one of the app\'s own routes', async () => {
    const code = 'export const Nav = () => {\n  return <a href="/">Home</a>;\n};\n';
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/nav.tsx');

    expect(ruleIds).toContain('@next/next/no-html-link-for-pages');
  });

  it('adds only the next/image mapping on top of the accessibility react() enables', () => {
    const a11y = Object.keys(next()[0]?.rules ?? {})
      .filter((rule) => {
        return rule.startsWith('jsx-a11y-x/');
      });

    const expected = ['jsx-a11y-x/alt-text'];
    expect(a11y).toEqual(expected);
  });

  it('reports an unsupported aria attribute through those rules', async () => {
    const code = 'export const Page = () => {\n  return <div aria-nonsense="x">a</div>;\n};\n';
    const ruleIds = await ruleIdsFor(composed(), code, 'src/app/page.tsx');

    expect(ruleIds).toContain('jsx-a11y-x/aria-props');
  });

  it('tells alt-text about next/image', () => {
    const expected = ['error', {
      elements: ['img'],
      img: ['Image'],
    }];
    expect(next()[0]?.rules?.['jsx-a11y-x/alt-text']).toEqual(expected);
  });

  it('registers only the next plugin', () => {
    const plugins = next()
      .flatMap((entry) => {
        return Object.keys(entry.plugins ?? {});
      });

    const expected = ['@next/next'];
    expect(plugins).toEqual(expected);
  });

  it('registers none of the plugins the replaced config bundled', () => {
    const registered = next()
      .flatMap((entry) => {
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

  it('registers no @typescript-eslint plugin of its own', () => {
    const registrations = next()
      .filter((entry) => {
        return entry.plugins !== undefined && '@typescript-eslint' in entry.plugins;
      });

    expect(registrations).toEqual([]);
  });

  it('claims no parser', () => {
    const parsers = next()
      .filter((entry) => {
        return entry.languageOptions?.['parser'] !== undefined;
      });

    expect(parsers).toEqual([]);
  });

  it.each([
    'next',
    'next/link',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    const config = base({ frameworkGroup: nextGroup });
    const actual = await sortsAheadOfPackages(config, specifier);
    expect(actual).toBe(true);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(next());
    const expected = [
      '@linteljs/next',
      '@linteljs/next/convention-filenames',
    ];
    expect(actual).toEqual(expected);
  });

  it('holds check-file off instrumentation-client.ts, which the naming map rejects', async () => {
    const naming = { 'src/**/!(*.test|*.spec).ts': 'CAMEL_CASE' } as const;
    const code = 'export const value = 1;\n';
    const path = 'src/instrumentation-client.ts';

    const unexempted = await ruleIdsFor(base({ naming }), code, path);
    const nextConfig = [
      ...base({ naming }),
      ...react(),
      ...next(),
      ...NEXT_PROJECT,
    ];
    const exempted = await ruleIdsFor(nextConfig, code, path);

    expect(unexempted).toContain(FILENAME_RULE);
    expect(exempted).not.toContain(FILENAME_RULE);
  });
});
