import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import { buildAliases } from './aliasUtils';

const TARGET_IDS = keysOf(ANSWERS.target.values);

describe('buildAliases', () => {
  it('builds the default React alias map, ordered as the spine reads top-down', () => {
    const aliases = buildAliases(answersFor({ target: 'react' }));
    const expected = {
      '@router/*': './src/router/*',
      '@pages/*': './src/pages/*',
      '@components/*': './src/components/*',
      '@ui/*': './src/components/ui/*',
      '@ui': './src/components/ui',
      '@features/*': './src/components/features/*',
      '@lib/*': './src/lib/*',
      '@store/*': './src/lib/store/*',
      '@hooks/*': './src/lib/hooks/*',
      '@utils/*': './src/lib/utils/*',
      '@services/*': './src/lib/services/*',
      '@styles/*': './src/styles/*',
      '@config/*': './src/config/*',
      '@mocks/*': './__mocks__/*',
    };
    expect(aliases).toEqual(expected);
  });

  it.each([
    [
      'solid',
      '@router/*',
      './src/router/*',
    ],
    [
      'vue',
      '@router/*',
      './src/router/*',
    ],
    [
      'nuxt',
      '@views/*',
      './src/views/*',
    ],
    [
      'astro',
      '@layouts/*',
      './src/layouts/*',
    ],
  ] as const)('leads the %s map with its route unit', (target, alias, directory) => {
    const aliases = buildAliases(answersFor({ target }));
    const first = Object.entries(aliases)[0];

    const expected = [alias, directory];
    expect(first).toEqual(expected);
  });

  it('leads the react map with its route table, then the pages it imports', () => {
    const aliases = buildAliases(answersFor({ target: 'react' }));
    const leading = Object.keys(aliases)
      .slice(0, 4);

    const expected = [
      '@router/*',
      '@pages/*',
      '@components/*',
      '@ui/*',
    ];
    expect(leading).toEqual(expected);
  });

  it('gives a target with no route unit no route alias', () => {
    const aliases = buildAliases(answersFor({ target: 'next' }));
    const keys = Object.keys(aliases);

    expect(keys[0]).toBe('@components/*');
  });

  it('renames the hooks alias per target', () => {
    const vue = buildAliases(answersFor({ target: 'vue' }));

    expect(vue['@composables/*']).toBe('./src/lib/composables/*');
    expect(vue['@hooks/*']).toBeUndefined();
  });

  it('omits the hooks alias for a target with no hook equivalent', () => {
    const angular = buildAliases(answersFor({ target: 'angular' }));
    const webextension = buildAliases(answersFor({ target: 'webextension' }));

    expect(angular['@hooks/*']).toBeUndefined();
    expect(webextension['@hooks/*']).toBeUndefined();
  });

  it('adds @i18n only when a locale is chosen', () => {
    const plain = buildAliases(answersFor({}));
    const localised = buildAliases(answersFor({ languages: ['ja'] }));

    expect(plain['@i18n/*']).toBeUndefined();
    expect(localised['@i18n/*']).toBe('./src/i18n/*');
  });

  it.each([
    ['react', ['@ui']],
    ['next', ['@ui']],
    ['vue', []],
    ['nuxt', []],
    ['svelte', []],
    ['solid', ['@ui']],
    ['angular', []],
    ['astro', []],
    ['webextension', []],
    ['react-native', []],
    ['typescript', []],
  ] as const)('gives %s an exact key only beside a barrel its starter writes', (target, expected) => {
    const aliases = buildAliases(answersFor({ target }));

    const exact = Object.keys(aliases)
      .filter((alias) => {
        return `${alias}/*` in aliases;
      });

    expect(exact).toEqual(expected);
  });

  it.each([
    'react',
    'next',
    'solid',
    'react-native',
  ] as const)('keeps the exact @ui key on %s when the form variant writes the barrel', (target) => {
    const aliases = buildAliases(answersFor({
      target,
      form: 'tanstack-form',
    }));

    expect(aliases['@ui']).toBe('./src/components/ui');
  });

  it('pairs no project alias, and leaves an exact one alone', () => {
    const standard = buildAliases(answersFor({}));
    const aliases = buildAliases(answersFor({
      aliases: {
        '@engine/*': './src/engine/*',
        '@ui': './src/ui-kit',
        '@entry': './src/entry.ts',
        '@flat/*': './src/flat.ts',
        '@glob': './src/glob/*',
        '@kit': './src/components/ui/*',
      },
    }));
    const added = Object.keys(aliases)
      .filter((alias) => {
        return !(alias in standard);
      });

    const expected = [
      '@engine/*',
      '@entry',
      '@flat/*',
      '@glob',
      '@kit',
    ];
    expect(added).toEqual(expected);

    expect(aliases['@ui']).toBe('./src/ui-kit');
    expect(aliases['@entry']).toBe('./src/entry.ts');
    expect(aliases['@entry/*']).toBeUndefined();
    expect(aliases['@flat']).toBeUndefined();
  });

  it('adds @apis with Zod or when the starter writes src/lib/apis', () => {
    const none = buildAliases(answersFor({ target: 'react' }));
    const zod = buildAliases(answersFor({
      target: 'react',
      libraries: ['zod'],
    }));
    const query = buildAliases(answersFor({
      target: 'react',
      data: 'tanstack-query',
    }));
    const form = buildAliases(answersFor({
      target: 'react',
      form: 'tanstack-form',
    }));
    const rtk = buildAliases(answersFor({
      target: 'react',
      data: 'rtk-query',
    }));
    const angular = buildAliases(answersFor({ target: 'angular' }));

    expect(none['@apis/*']).toBeUndefined();
    expect(query['@apis/*']).toBeUndefined();
    expect(zod['@apis/*']).toBe('./src/lib/apis/*');
    expect(form['@apis/*']).toBe('./src/lib/apis/*');
    expect(rtk['@apis/*']).toBe('./src/lib/apis/*');
    expect(angular['@apis/*']).toBe('./src/lib/apis/*');
  });

  it('carries the extra aliases only one target has, at the tail of the lib family', () => {
    const next = buildAliases(answersFor({ target: 'next' }));
    const react = buildAliases(answersFor({ target: 'react' }));

    expect(next['@server/*']).toBe('./src/lib/server/*');
    expect(next['@content/*']).toBe('./src/content/*');
    expect(react['@server/*']).toBeUndefined();
  });

  it('omits shared aliases a target does not have', () => {
    const plain = buildAliases(answersFor({ target: 'webextension' }));

    expect(plain['@store/*']).toBeUndefined();
    expect(plain['@model/*']).toBe('./src/lib/model/*');
  });

  it('aliases providers on no target at all', () => {
    for (const target of TARGET_IDS) {
      const aliases = buildAliases(answersFor({ target }));
      expect(aliases['@providers/*']).toBeUndefined();
    }
  });

  it('drops @mocks when testing is declined', () => {
    const aliases = buildAliases({
      ...answersFor({}),
      testing: 'none',
    })['@mocks/*'];

    expect(aliases).toBeUndefined();
  });
});
