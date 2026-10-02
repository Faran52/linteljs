import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import { buildAliases } from './aliasUtils';

const TARGET_IDS = valuesOf(ANSWERS.target.values);

describe('buildAliases', () => {
  it('builds the default React alias map, ordered as the spine reads top-down', () => {
    expect(buildAliases(answersFor({ target: 'react' }))).toEqual({
      '@pages/*': './src/pages/*',
      '@pages': './src/pages',
      '@components/*': './src/components/*',
      '@components': './src/components',
      '@ui/*': './src/components/ui/*',
      '@ui': './src/components/ui',
      '@features/*': './src/components/features/*',
      '@features': './src/components/features',
      '@lib/*': './src/lib/*',
      '@lib': './src/lib',
      '@store/*': './src/lib/store/*',
      '@store': './src/lib/store',
      '@hooks/*': './src/lib/hooks/*',
      '@hooks': './src/lib/hooks',
      '@utils/*': './src/lib/utils/*',
      '@utils': './src/lib/utils',
      '@services/*': './src/lib/services/*',
      '@services': './src/lib/services',
      '@styles/*': './src/styles/*',
      '@styles': './src/styles',
      '@config/*': './src/config/*',
      '@config': './src/config',
      '@mocks/*': './__mocks__/*',
      '@mocks': './__mocks__',
    });
  });

  it.each([
    [
      'solid',
      '@pages/*',
      './src/pages/*',
    ],
    [
      'vue',
      '@views/*',
      './src/views/*',
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
    const first = Object.entries(buildAliases(answersFor({ target })))[0];

    expect(first).toEqual([alias, directory]);
  });

  it('gives a target with no route unit no route alias', () => {
    const keys = Object.keys(buildAliases(answersFor({ target: 'next' })));

    expect(keys[0]).toBe('@components/*');
  });

  it('renames the hooks alias per target', () => {
    expect(buildAliases(answersFor({ target: 'vue' }))['@composables/*'])
      .toBe('./src/lib/composables/*');

    expect(buildAliases(answersFor({ target: 'vue' }))['@hooks/*']).toBeUndefined();
  });

  it('omits the hooks alias for a target with no hook equivalent', () => {
    expect(buildAliases(answersFor({ target: 'angular' }))['@hooks/*']).toBeUndefined();
    expect(buildAliases(answersFor({ target: 'webextension' }))['@hooks/*']).toBeUndefined();
  });

  it('drops the exact key with the omitted alias it pairs', () => {
    expect(buildAliases(answersFor({ target: 'angular' }))['@hooks']).toBeUndefined();
  });

  it('adds @i18n and its exact key only when a locale is chosen', () => {
    const plain = buildAliases(answersFor({}));
    const localised = buildAliases(answersFor({ languages: ['ja'] }));

    expect(plain['@i18n/*']).toBeUndefined();
    expect(plain['@i18n']).toBeUndefined();
    expect(localised['@i18n/*']).toBe('./src/i18n/*');
    expect(localised['@i18n']).toBe('./src/i18n');
  });

  it('pairs a project alias onto a directory, and leaves an exact one alone', () => {
    const standard = buildAliases(answersFor({}));
    const aliases = buildAliases(answersFor({
      aliases: {
        '@engine/*': './src/engine/*',
        '@ui': './src/ui-kit',
        '@entry': './src/entry.ts',
        '@flat/*': './src/flat.ts',
        '@glob': './src/glob/*',
      },
    }));
    const added = Object.keys(aliases)
      .filter((alias) => {
        return !(alias in standard);
      });

    expect(added).toEqual([
      '@engine/*',
      '@engine',
      '@entry',
      '@flat/*',
      '@glob',
    ]);

    expect(aliases['@engine']).toBe('./src/engine');
    expect(aliases['@ui']).toBe('./src/ui-kit');
    expect(aliases['@entry']).toBe('./src/entry.ts');
    expect(aliases['@entry/*']).toBeUndefined();
    expect(aliases['@flat']).toBeUndefined();
  });

  it('adds @apis with Zod or when the starter writes src/lib/apis', () => {
    const none = buildAliases(answersFor({ target: 'react' }))['@apis/*'];
    const zod = buildAliases(answersFor({
      target: 'react',
      libraries: ['zod'],
    }))['@apis/*'];
    const query = buildAliases(answersFor({
      target: 'react',
      data: 'tanstack-query',
    }))['@apis/*'];
    const form = buildAliases(answersFor({
      target: 'react',
      form: 'tanstack-form',
    }))['@apis/*'];
    const rtk = buildAliases(answersFor({
      target: 'react',
      data: 'rtk-query',
    }))['@apis/*'];
    const angular = buildAliases(answersFor({ target: 'angular' }))['@apis/*'];

    expect(none).toBeUndefined();
    expect(query).toBeUndefined();
    expect(zod).toBe('./src/lib/apis/*');
    expect(form).toBe('./src/lib/apis/*');
    expect(rtk).toBe('./src/lib/apis/*');
    expect(angular).toBe('./src/lib/apis/*');
  });

  it('carries the extra aliases only one target has, at the tail of the lib family', () => {
    const next = buildAliases(answersFor({ target: 'next' }));

    expect(next['@server/*']).toBe('./src/lib/server/*');
    expect(next['@content/*']).toBe('./src/content/*');
    expect(buildAliases(answersFor({ target: 'react' }))['@server/*']).toBeUndefined();
  });

  it('omits shared aliases a target does not have', () => {
    const plain = buildAliases(answersFor({ target: 'webextension' }));

    expect(plain['@store/*']).toBeUndefined();
    expect(plain['@model/*']).toBe('./src/lib/model/*');
  });

  it('aliases providers on no target at all', () => {
    for (const target of TARGET_IDS) {
      expect(buildAliases(answersFor({ target }))['@providers/*']).toBeUndefined();
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
