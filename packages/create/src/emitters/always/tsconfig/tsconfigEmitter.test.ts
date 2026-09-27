import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';

import { emitNuxtConfig } from '../../target/nuxt-config/nuxtConfigEmitter';
import { buildAliases } from '../../utils/aliasUtils';
import { emitEslintConfig } from '../eslint-config/eslintConfigEmitter';

import {
  buildTsconfig,
  emitTsconfig,
  tsconfigEmitter,
} from './tsconfigEmitter';

import type {
  Answers,
  Data,
  HostedFramework,
  Library,
  Router,
  Styling,
  TargetId,
  Testing,
} from '@config/types';

interface AnswerOverrides {
  hostedFramework?: HostedFramework;
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  styling?: Styling;
  data?: Data;
  router?: Router;
}

// The keys a target's own tsconfig delta decides, over the shared base.
interface TypesSource {
  extends?: string;
  include: string[];
  jsx?: string;
  jsxImportSource?: string;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

describe('buildTsconfig', () => {
  // The shared standard whole, as a React project receives it: every other case here is a delta from this one.
  it('carries the shared base', () => {
    const expected = {
      compilerOptions: {
        rootDir: '.',
        target: 'esnext',
        lib: ['dom', 'dom.iterable', 'esnext'],
        useDefineForClassFields: true,
        jsx: 'react-jsx',
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: 'force',
        importHelpers: true,
        verbatimModuleSyntax: true,
        noEmit: true,
        incremental: true,
        strict: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        noImplicitOverride: true,
        noFallthroughCasesInSwitch: true,
        allowUnreachableCode: false,
        allowUnusedLabels: false,
        erasableSyntaxOnly: true,
        allowJs: true,
        checkJs: false,
        skipLibCheck: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        types: ['node', 'vite/client', 'vitest/globals'],
        paths: {
          '@components/*': ['./src/components/*'],
          '@ui/*': ['./src/components/ui/*'],
          '@features/*': ['./src/components/features/*'],
          '@lib/*': ['./src/lib/*'],
          '@store/*': ['./src/lib/store/*'],
          '@hooks/*': ['./src/lib/hooks/*'],
          '@utils/*': ['./src/lib/utils/*'],
          '@services/*': ['./src/lib/services/*'],
          '@config/*': ['./src/config/*'],
          '@mocks/*': ['./__mocks__/*'],
        },
      },
      include: ['**/*.ts', '**/*.tsx', '**/*.mts'],
      exclude: ['node_modules', 'dist', 'build', 'coverage'],
    };

    // Strict: an optional key the target leaves unset is absent, not present and undefined.
    expect(buildTsconfig(answersFor({ target: 'react' }))).toStrictEqual(expected);
    expect(emitTsconfig(answersFor({ target: 'react' }))).toBe(`${JSON.stringify(expected, null, 2)}\n`);
  });

  it('adds no include of its own for tailwind on a target that declares none', () => {
    expect(buildTsconfig(answersFor({
      target: 'react',
      styling: 'tailwind',
    })).include).toEqual(['**/*.ts', '**/*.tsx', '**/*.mts']);
  });

  it('leaves unused-locals to the unused-imports rule', () => {
    const text = emitTsconfig(answersFor({}));

    expect(text).not.toContain('noUnusedLocals');
    expect(text).not.toContain('noUnusedParameters');
  });

  it('flips useDefineForClassFields and drops erasableSyntaxOnly for Angular', () => {
    const { compilerOptions } = buildTsconfig(answersFor({ target: 'angular' }));

    expect(compilerOptions.useDefineForClassFields).toBe(false);
    expect(compilerOptions).not.toHaveProperty('erasableSyntaxOnly');
  });

  // Where each target's own types come from: the config it extends, what it adds to `include`, and its JSX mode.
  it.each<[string, AnswerOverrides, TypesSource]>([
    ['react', { target: 'react' }, {
      include: ['**/*.ts', '**/*.tsx', '**/*.mts'],
      jsx: 'react-jsx',
    }],
    ['react in framework mode', {
      target: 'react',
      router: 'react-router-framework',
    }, {
      include: ['**/*.ts', '**/*.tsx', '**/*.mts', '.react-router/types/**/*'],
      jsx: 'react-jsx',
    }],
    ['next', { target: 'next' }, {
      include: ['**/*.ts', '**/*.tsx', '**/*.mts', 'next-env.d.ts', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
      jsx: 'react-jsx',
    }],
    ['vue', { target: 'vue' }, {
      include: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.vue'],
      jsx: 'preserve',
    }],
    ['nuxt', { target: 'nuxt' }, {
      extends: './.nuxt/tsconfig.app.json',
      include: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.vue', '.nuxt/nuxt.d.ts'],
      jsx: 'preserve',
    }],
    ['svelte', { target: 'svelte' }, {
      extends: './.svelte-kit/tsconfig.json',
      include: [
        '**/*.ts', '**/*.tsx', '**/*.mts',
        '**/*.svelte',
        '.svelte-kit/ambient.d.ts',
        '.svelte-kit/env.d.ts',
        '.svelte-kit/non-ambient.d.ts',
        '.svelte-kit/types/**/$types.d.ts',
      ],
    }],
    ['solid', { target: 'solid' }, {
      include: ['**/*.ts', '**/*.tsx', '**/*.mts'],
      jsx: 'preserve',
      jsxImportSource: 'solid-js',
    }],
    ['angular', { target: 'angular' }, { include: ['**/*.ts', '**/*.tsx', '**/*.mts'] }],
    ['astro', { target: 'astro' }, {
      extends: 'astro/tsconfigs/strict',
      include: ['**/*.ts', '**/*.tsx', '**/*.mts', '.astro/types.d.ts', '**/*.astro'],
    }],
    ['webextension', { target: 'webextension' }, { include: ['**/*.ts', '**/*.tsx', '**/*.mts'] }],
    ['react-native', { target: 'react-native' }, {
      extends: 'expo/tsconfig.base',
      include: ['**/*.ts', '**/*.tsx', '**/*.mts', '.expo/types/**/*.ts', 'expo-env.d.ts'],
      jsx: 'react-jsx',
    }],
  ])('reads %s its own way', (_label, overrides, expected) => {
    const {
      extends: base,
      include,
      compilerOptions,
    } = buildTsconfig(answersFor(overrides));

    expect({
      extends: base,
      include,
      jsx: compilerOptions.jsx,
      jsxImportSource: compilerOptions.jsxImportSource,
    }).toStrictEqual({
      extends: undefined,
      jsx: undefined,
      jsxImportSource: undefined,
      ...expected,
    });
  });

  it('declares every key Next would otherwise inject', () => {
    const { compilerOptions, include } = buildTsconfig(answersFor({ target: 'next' }));

    expect(compilerOptions.plugins).toEqual([{ name: 'next' }]);
    expect(include).toContain('next-env.d.ts');
    expect(include).toContain('.next/types/**/*.ts');
    expect(include).toContain('.next/dev/types/**/*.ts');
  });

  it('drops vitest globals when testing is declined', () => {
    expect(buildTsconfig(answersFor({ testing: 'none' })).compilerOptions.types)
      .toEqual(['node', 'vite/client']);
  });

  // `types` is the whole allow-list once it names anything: `vite/client` only where Vite builds, and a target's
  // own ambient types after the shared ones.
  it.each<[TargetId, string[]]>([
    ['react', ['node', 'vite/client', 'vitest/globals']],
    ['next', ['node', 'vitest/globals']],
    ['vue', ['node', 'vite/client', 'vitest/globals']],
    ['nuxt', ['node', 'vitest/globals']],
    ['svelte', ['node', 'vite/client', 'vitest/globals']],
    ['solid', ['node', 'vite/client', 'vitest/globals']],
    ['angular', ['node', 'vitest/globals']],
    ['astro', ['node', 'vitest/globals', 'astro/client']],
    ['webextension', ['node', 'vite/client', 'vitest/globals', 'chrome']],
    ['react-native', ['node', 'vitest/globals']],
  ])('declares the ambient types %s builds against', (target, types) => {
    expect(buildTsconfig(answersFor({ target })).compilerOptions.types).toEqual(types);
  });

  it('allows the ts extension the shipped scripts import with, by rewrite where ngtsc drops noEmit', () => {
    const optionsOf = (target: 'angular' | 'react' | 'vue') => {
      const { allowImportingTsExtensions, rewriteRelativeImportExtensions } = buildTsconfig(answersFor({ target }))
        .compilerOptions;

      return [allowImportingTsExtensions, rewriteRelativeImportExtensions];
    };

    expect([optionsOf('react'), optionsOf('vue'), optionsOf('angular')])
      .toEqual([[true, undefined], [true, undefined], [false, true]]);
  });

  /*
   * Framework mode's generated route types sit under `.react-router/types` and are written by `typegen`. `rootDirs`
   * is what lets a route module import its own `Route.*` from a path beside itself rather than from that tree.
   */
  it('merges the generated route types into the source tree for framework mode', () => {
    const { compilerOptions, include } = buildTsconfig(answersFor({
      target: 'react',
      router: 'react-router-framework',
    }));

    expect(compilerOptions.rootDirs).toEqual(['.', './.react-router/types']);
    expect(include).toContain('.react-router/types/**/*');
    expect(buildTsconfig(answersFor({ target: 'react' })).compilerOptions).not.toHaveProperty('rootDirs');
  });

  // Otherwise NativeWind adds it on the first bundle, and `check` rewrites the project it is checking.
  it('includes the NativeWind declaration file on react-native under tailwind alone', () => {
    const styled = buildTsconfig(answersFor({
      target: 'react-native',
      styling: 'tailwind',
    })).include;

    expect(styled).toContain('nativewind-env.d.ts');
    expect(buildTsconfig(answersFor({ target: 'react-native' })).include).not.toContain('nativewind-env.d.ts');
    expect(buildTsconfig(answersFor({
      target: 'react',
      styling: 'tailwind',
    })).include).not.toContain('nativewind-env.d.ts');
  });

  it('drops noEmit only on angular, whose vitest compiler has to emit', () => {
    expect(buildTsconfig(answersFor({ target: 'angular' })).compilerOptions.noEmit)
      .toBeUndefined();
    expect(buildTsconfig(answersFor({ target: 'react' })).compilerOptions.noEmit).toBe(true);
  });
});

// The alias list feeds tsconfig paths, the import-sort buckets and the resolver; hand-kept copies drifted.
describe('alias coupling', () => {
  for (const target of TARGET_IDS.filter((id) => {
    return id !== 'nuxt';
  })) {
    for (const withZod of [true, false]) {
      const libraries: Library[] = withZod ? ['zod'] : [];
      const label = `${target}${withZod ? ' with zod' : ''}`;

      it(`emits the same alias map into tsconfig paths and base() for ${label}`, () => {
        const answers = answersFor({
          target,
          libraries,
        });
        const aliases = buildAliases(answers);
        const { paths } = buildTsconfig(answers).compilerOptions;
        const config = emitEslintConfig(answers);

        expect(Object.keys(paths ?? {})).toEqual(Object.keys(aliases));

        for (const [alias, directory] of Object.entries(aliases)) {
          expect(paths?.[alias]).toEqual([directory]);
          expect(config).toContain(`'${alias}': '${directory}',`);
        }

        // Anything outside the shared list reaching one consumer and not the others is the failure this pins.
        // `[@$]` with an optional wildcard, since `$lib` is spelled both ways and Expo's `@/*` has no segment.
        const body = config.replaceAll(/^import .*$/gm, '');
        const emitted = body.match(/'[@$][\w-]*(?:\/[\w-]+)*(?:\/\*)?'/g) ?? [];

        expect(emitted).toEqual(
          Object.keys(aliases).map((alias) => {
            return `'${alias}'`;
          }),
        );
      });
    }
  }

  // Hand-edited into `eslint.config.js` they lasted until the next sync.
  it("carries a project's own aliases through all three consumers", () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      aliases: {
        '@engine': './src/lib/engine/index.ts',
        '@workers/*': './src/workers/*',
      },
    };
    const { paths } = buildTsconfig(answers).compilerOptions;
    const config = emitEslintConfig(answers);

    expect(paths?.['@engine']).toEqual(['./src/lib/engine/index.ts']);
    expect(paths?.['@workers/*']).toEqual(['./src/workers/*']);
    expect(buildAliases(answers)['@engine']).toBe('./src/lib/engine/index.ts');
    expect(config).toContain("'@engine': './src/lib/engine/index.ts',");
    expect(config).toContain("'@workers/*': './src/workers/*',");
  });

  /*
   * Nuxt is the one target whose aliases do not reach tsconfig through `paths`. It declares them in
   * `nuxt.config.ts`, which merges them into the paths Nuxt generates, and the emitted `tsconfig.json` extends
   * that and inherits the merged set. So the same coupling holds, one file over.
   */
  it('carries the alias map through nuxt.config for nuxt, whose tsconfig declares none', () => {
    const answers = answersFor({ target: 'nuxt' });
    const aliases = buildAliases(answers);
    const nuxtConfig = emitNuxtConfig(answers);
    const config = emitEslintConfig(answers);

    expect(buildTsconfig(answers).compilerOptions.paths).toBeUndefined();

    for (const [alias, directory] of Object.entries(aliases)) {
      const prefix = alias.replace('/*', '');
      // Absolute, because Nuxt writes these into `.nuxt/` and reads them relative to it.
      const root = directory.replace('/*', '').replace('./', '');

      expect(nuxtConfig).toContain(`'${prefix}': join(import.meta.dirname, '${root}'),`);
      // The wildcard too: TypeScript resolves by pattern where Vite resolves by prefix.
      expect(nuxtConfig).toContain(`'${prefix}/*': join(import.meta.dirname, '${root}/*'),`);
      expect(config).toContain(`'${alias}': '${directory}',`);
    }
  });

  // Last, so a restated one is deliberate.
  it('lets a project restate a standard alias, and keeps the order', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      aliases: { '@utils/*': './src/shared/utils/*' },
    };
    const aliases = buildAliases(answers);

    expect(aliases['@utils/*']).toBe('./src/shared/utils/*');
    expect(Object.keys(aliases)[0]).toBe('@components/*');
  });

  it('carries the target-only aliases through all three consumers', () => {
    const answers = answersFor({ target: 'next' });
    const { paths } = buildTsconfig(answers).compilerOptions;

    expect(paths?.['@server/*']).toEqual(['./src/lib/server/*']);
    expect(paths?.['@content/*']).toEqual(['./src/content/*']);
    expect(buildAliases(answers)['@server/*']).toBe('./src/lib/server/*');
    expect(emitEslintConfig(answers)).toContain("'@content/*': './src/content/*',");
  });

  it('gives them to no other target', () => {
    const others = TARGET_IDS.filter((target) => {
      return target !== 'next';
    });

    for (const target of others) {
      // `?? {}` for nuxt, whose tsconfig declares no paths at all: absent is the strongest form of not having one.
      const { paths } = buildTsconfig(answersFor({ target })).compilerOptions;

      expect(paths ?? {}).not.toHaveProperty('@server/*');
      expect(paths ?? {}).not.toHaveProperty('@content/*');
    }
  });

  // Expo's own two, the assets outside `src/` among them, and the hooks where Expo keeps them rather than under `lib/`.
  it("resolves react native's hooks and Expo's aliases where its tree keeps them", () => {
    const { paths } = buildTsconfig(answersFor({ target: 'react-native' })).compilerOptions;

    expect(paths?.['@hooks/*']).toEqual(['./src/hooks/*']);
    expect(paths?.['@/assets/*']).toEqual(['./assets/*']);
    expect(paths?.['@/*']).toEqual(['./src/*']);
  });

  // An alias naming a directory the target's repo-structure.md does not describe is a dead end.
  it("matches the extension target's own documented layout", () => {
    const { paths } = buildTsconfig(answersFor({ target: 'webextension' })).compilerOptions;

    expect(paths?.['@model/*']).toEqual(['./src/lib/model/*']);
    expect(paths).not.toHaveProperty('@store/*');
    expect(paths).not.toHaveProperty('@providers/*');
    expect(buildTsconfig(answersFor({ target: 'react' })).compilerOptions.paths)
      .toHaveProperty('@store/*');
    expect(buildTsconfig(answersFor({ target: 'react' })).compilerOptions.paths)
      .not.toHaveProperty('@providers/*');
  });

  // `svelte-kit sync` writes `.svelte-kit/tsconfig.json`; extending it replaces `paths`, so `$lib` is redeclared.
  it('extends what SvelteKit generates, and keeps $lib resolvable through it', () => {
    const config = buildTsconfig(answersFor({ target: 'svelte' }));

    expect(config.extends).toBe('./.svelte-kit/tsconfig.json');
    expect(config.compilerOptions.paths?.['$lib']).toEqual(['./src/lib']);
    expect(config.compilerOptions.paths?.['$lib/*']).toEqual(['./src/lib/*']);
    expect(buildTsconfig(answersFor({ target: 'react' })).extends).toBeUndefined();
  });
});

// Measured: 213 `TS17004` and 245 `TS7026` in a hosted extension before the JSX settings arrived.
describe('a hosted framework brings its own JSX settings', () => {
  it('gives the extension solid’s mode and import source', () => {
    const { compilerOptions } = buildTsconfig(
      answersFor({
        target: 'webextension',
        hostedFramework: 'solid',
      }),
    );

    expect(compilerOptions.jsx).toBe('preserve');
    expect(compilerOptions.jsxImportSource).toBe('solid-js');
  });

  it('gives it react’s, which needs no import source', () => {
    const { compilerOptions } = buildTsconfig(
      answersFor({
        target: 'webextension',
        hostedFramework: 'react',
      }),
    );

    expect(compilerOptions.jsx).toBe('react-jsx');
    expect(compilerOptions).not.toHaveProperty('jsxImportSource');
  });

  it('adds none for a single-file-component framework, or for no framework at all', () => {
    expect(buildTsconfig(answersFor({
      target: 'webextension',
      hostedFramework: 'vue',
    })).compilerOptions)
      .not.toHaveProperty('jsx');
    expect(buildTsconfig(answersFor({ target: 'webextension' })).compilerOptions)
      .not.toHaveProperty('jsx');
  });
});

describe('tsconfigEmitter', () => {
  it('writes the emitted text to tsconfig.json at the package stage', () => {
    expect(tsconfigEmitter(answersFor({}))).toEqual([{
      stage: 'package',
      target: 'tsconfig.json',
      content: { text: emitTsconfig(answersFor({})) },
    }]);
  });
});
