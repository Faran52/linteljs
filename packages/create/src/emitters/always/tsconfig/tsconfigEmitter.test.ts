import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { keysOf } from '@utils/objectUtils';

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

interface TypesSource {
  extends?: string;
  include: string[];
  jsx?: string;
  jsxImportSource?: string;
}

const TARGET_IDS = keysOf(ANSWERS.target.values);

describe('buildTsconfig', () => {
  it('carries the shared base', () => {
    const expected = {
      compilerOptions: {
        rootDir: '.',
        target: 'esnext',
        lib: [
          'dom',
          'dom.iterable',
          'esnext',
        ],
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
        types: [
          'node',
          'vite/client',
          'vitest/globals',
        ],
        paths: {
          '@pages/*': ['./src/pages/*'],
          '@pages': ['./src/pages'],
          '@components/*': ['./src/components/*'],
          '@components': ['./src/components'],
          '@ui/*': ['./src/components/ui/*'],
          '@ui': ['./src/components/ui'],
          '@features/*': ['./src/components/features/*'],
          '@features': ['./src/components/features'],
          '@lib/*': ['./src/lib/*'],
          '@lib': ['./src/lib'],
          '@store/*': ['./src/lib/store/*'],
          '@store': ['./src/lib/store'],
          '@hooks/*': ['./src/lib/hooks/*'],
          '@hooks': ['./src/lib/hooks'],
          '@utils/*': ['./src/lib/utils/*'],
          '@utils': ['./src/lib/utils'],
          '@services/*': ['./src/lib/services/*'],
          '@services': ['./src/lib/services'],
          '@styles/*': ['./src/styles/*'],
          '@styles': ['./src/styles'],
          '@config/*': ['./src/config/*'],
          '@config': ['./src/config'],
          '@mocks/*': ['./__mocks__/*'],
          '@mocks': ['./__mocks__'],
        },
      },
      include: [
        '**/*.ts',
        '**/*.tsx',
        '**/*.mts',
      ],
      exclude: [
        'node_modules',
        'dist',
        'build',
        'coverage',
      ],
    };

    const tsconfig = buildTsconfig(answersFor({ target: 'react' }));
    expect(tsconfig).toStrictEqual(expected);
    const emitted = emitTsconfig(answersFor({ target: 'react' }));
    expect(emitted).toBe(`${JSON.stringify(expected, null, 2)}\n`);
  });

  it('adds no include of its own for tailwind on a target that declares none', () => {
    const { include } = buildTsconfig(answersFor({
      target: 'react',
      styling: 'tailwind',
    }));

    const expected = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.mts',
    ];
    expect(include).toEqual(expected);
  });

  it('leaves unused-locals to the unused-imports rule', () => {
    const text = emitTsconfig(answersFor({}));

    expect(text).not.toContain('noUnusedLocals');
    expect(text).not.toContain('noUnusedParameters');
  });

  it('flips useDefineForClassFields and keeps erasableSyntaxOnly for Angular', () => {
    const { compilerOptions } = buildTsconfig(answersFor({ target: 'angular' }));

    expect(compilerOptions.useDefineForClassFields).toBe(false);
    expect(compilerOptions.erasableSyntaxOnly).toBe(true);
  });

  it.each<[string, AnswerOverrides, TypesSource]>([
    [
      'react',
      { target: 'react' },
      {
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
        ],
        jsx: 'react-jsx',
      },
    ],
    [
      'react in framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      {
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          '.react-router/types/**/*',
        ],
        jsx: 'react-jsx',
      },
    ],
    [
      'next',
      { target: 'next' },
      {
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          'next-env.d.ts',
          '.next/types/**/*.ts',
          '.next/dev/types/**/*.ts',
        ],
        jsx: 'react-jsx',
      },
    ],
    [
      'vue',
      { target: 'vue' },
      {
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          '**/*.vue',
        ],
        jsx: 'preserve',
      },
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      {
        extends: './.nuxt/tsconfig.app.json',
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          '**/*.vue',
          '.nuxt/nuxt.d.ts',
        ],
        jsx: 'preserve',
      },
    ],
    [
      'svelte',
      { target: 'svelte' },
      {
        extends: '$app/tsconfig',
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          '**/*.svelte',
        ],
      },
    ],
    [
      'solid',
      { target: 'solid' },
      {
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
        ],
        jsx: 'preserve',
        jsxImportSource: 'solid-js',
      },
    ],
    [
      'angular',
      { target: 'angular' },
      { include: [
        '**/*.ts',
        '**/*.tsx',
        '**/*.mts',
      ] },
    ],
    [
      'astro',
      { target: 'astro' },
      {
        extends: 'astro/tsconfigs/strict',
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          '.astro/types.d.ts',
          '**/*.astro',
        ],
      },
    ],
    [
      'webextension',
      { target: 'webextension' },
      { include: [
        '**/*.ts',
        '**/*.tsx',
        '**/*.mts',
      ] },
    ],
    [
      'react-native',
      { target: 'react-native' },
      {
        extends: 'expo/tsconfig.base',
        include: [
          '**/*.ts',
          '**/*.tsx',
          '**/*.mts',
          '.expo/types/**/*.ts',
          'expo-env.d.ts',
        ],
        jsx: 'react-jsx',
      },
    ],
  ])('reads %s its own way', (_label, overrides, expected) => {
    const {
      extends: base,
      include,
      compilerOptions,
    } = buildTsconfig(answersFor(overrides));

    const actual = {
      extends: base,
      include,
      jsx: compilerOptions.jsx,
      jsxImportSource: compilerOptions.jsxImportSource,
    };
    const settings = {
      extends: undefined,
      jsx: undefined,
      jsxImportSource: undefined,
      ...expected,
    };
    expect(actual).toStrictEqual(settings);
  });

  it('declares every key Next would otherwise inject', () => {
    const { compilerOptions, include } = buildTsconfig(answersFor({ target: 'next' }));

    const expected = [{ name: 'next' }];
    expect(compilerOptions.plugins).toEqual(expected);
    expect(include).toContain('next-env.d.ts');
    expect(include).toContain('.next/types/**/*.ts');
    expect(include).toContain('.next/dev/types/**/*.ts');
  });

  it('drops vitest globals when testing is declined', () => {
    const expected = ['node', 'vite/client'];

    const { compilerOptions } = buildTsconfig(answersFor({ testing: 'none' }));

    expect(compilerOptions.types).toEqual(expected);
  });

  it.each<[TargetId, string[]]>([
    ['react', [
      'node',
      'vite/client',
      'vitest/globals',
    ]],
    ['next', ['node', 'vitest/globals']],
    ['vue', [
      'node',
      'vite/client',
      'vitest/globals',
    ]],
    ['nuxt', ['node', 'vitest/globals']],
    ['svelte', [
      'node',
      'vite/client',
      'vitest/globals',
      '$app/types',
    ]],
    ['solid', [
      'node',
      'vite/client',
      'vitest/globals',
    ]],
    ['angular', ['node', 'vitest/globals']],
    ['astro', [
      'node',
      'vitest/globals',
      'astro/client',
    ]],
    ['webextension', [
      'node',
      'vite/client',
      'vitest/globals',
      'chrome',
    ]],
    ['react-native', ['node', 'jest']],
  ])('declares the ambient types %s builds against', (target, types) => {
    const { compilerOptions } = buildTsconfig(answersFor({ target }));

    expect(compilerOptions.types).toEqual(types);
  });

  it('allows the ts extension the shipped scripts import with, by rewrite where ngtsc drops noEmit', () => {
    const optionsOf = (target: 'angular' | 'react' | 'vue') => {
      const { compilerOptions } = buildTsconfig(answersFor({ target }));
      const { allowImportingTsExtensions, rewriteRelativeImportExtensions } = compilerOptions;

      const extensionOptions = [allowImportingTsExtensions, rewriteRelativeImportExtensions];
      return extensionOptions;
    };

    const actual = [
      optionsOf('react'),
      optionsOf('vue'),
      optionsOf('angular'),
    ];
    const expected = [
      [true, undefined],
      [true, undefined],
      [false, true],
    ];

    expect(actual)
      .toEqual(expected);
  });

  it('merges the generated route types into the source tree for framework mode', () => {
    const { compilerOptions, include } = buildTsconfig(answersFor({
      target: 'react',
      router: 'react-router-framework',
    }));

    const expected = ['.', './.react-router/types'];
    expect(compilerOptions.rootDirs).toEqual(expected);
    expect(include).toContain('.react-router/types/**/*');
    const dataMode = buildTsconfig(answersFor({ target: 'react' }));
    expect(dataMode.compilerOptions).not.toHaveProperty('rootDirs');
  });

  it('includes the NativeWind declaration file on react-native under tailwind alone', () => {
    const styled = buildTsconfig(answersFor({
      target: 'react-native',
      styling: 'tailwind',
    }));
    const unstyled = buildTsconfig(answersFor({ target: 'react-native' }));

    expect(styled.include).toContain('nativewind-env.d.ts');
    expect(unstyled.include).not.toContain('nativewind-env.d.ts');

    const { include } = buildTsconfig(answersFor({
      target: 'react',
      styling: 'tailwind',
    }));

    expect(include).not.toContain('nativewind-env.d.ts');
  });

  it('drops noEmit only on angular, whose vitest compiler has to emit', () => {
    const angular = buildTsconfig(answersFor({ target: 'angular' }));
    const react = buildTsconfig(answersFor({ target: 'react' }));

    expect(angular.compilerOptions.noEmit).toBeUndefined();
    expect(react.compilerOptions.noEmit).toBe(true);
  });
});

describe('alias coupling', () => {
  const pathTargets = TARGET_IDS
    .filter((id) => {
      return id !== 'nuxt';
    });
  const zodChoices = [true, false];
  const zod: Library[] = ['zod'];

  for (const target of pathTargets) {
    for (const withZod of zodChoices) {
      const libraries: Library[] = withZod ? zod : [];
      const label = `${target}${withZod ? ' with zod' : ''}`;

      it(`emits the same alias map into tsconfig paths and base() for ${label}`, () => {
        const answers = answersFor({
          target,
          libraries,
        });
        const aliases = buildAliases(answers);
        const { paths } = buildTsconfig(answers).compilerOptions;
        const config = emitEslintConfig(answers);

        const actual = Object.keys(paths ?? {});
        expect(actual).toEqual(Object.keys(aliases));

        for (const [alias, directory] of Object.entries(aliases)) {
          const expected = [directory];
          expect(paths?.[alias]).toEqual(expected);
          expect(config).toContain(`'${alias}': '${directory}',`);
        }

        const body = config.replaceAll(/^import .*$/gm, '');
        const emitted = body.match(/'[@$][\w-]*(?:\/[\w-]+)*(?:\/\*)?'/g) ?? [];

        const quotedAliases = Object.keys(aliases)
          .map((alias) => {
            return `'${alias}'`;
          });

        expect(emitted).toEqual(
          quotedAliases,
        );
      });
    }
  }

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

    const expected = ['./src/lib/engine/index.ts'];
    expect(paths?.['@engine']).toEqual(expected);
    const workers = ['./src/workers/*'];
    expect(paths?.['@workers/*']).toEqual(workers);
    expect(buildAliases(answers)['@engine']).toBe('./src/lib/engine/index.ts');
    expect(config).toContain("'@engine': './src/lib/engine/index.ts',");
    expect(config).toContain("'@workers/*': './src/workers/*',");
  });

  it('carries the alias map through nuxt.config for nuxt, whose tsconfig declares none', () => {
    const answers = answersFor({ target: 'nuxt' });
    const aliases = buildAliases(answers);
    const nuxtConfig = emitNuxtConfig(answers, 'demo-app');
    const config = emitEslintConfig(answers);

    expect(buildTsconfig(answers).compilerOptions.paths).toBeUndefined();

    for (const [alias, directory] of Object.entries(aliases)) {
      const prefix = alias.replace('/*', '');
      const root = directory
        .replace('/*', '')
        .replace('./', '');

      expect(nuxtConfig).toContain(`'${prefix}': join(import.meta.dirname, '${root}'),`);
      expect(nuxtConfig).toContain(`'${prefix}/*': join(import.meta.dirname, '${root}/*'),`);
      expect(config).toContain(`'${alias}': '${directory}',`);
    }
  });

  it('lets a project restate a standard alias, and keeps the order', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      aliases: { '@utils/*': './src/shared/utils/*' },
    };
    const aliases = buildAliases(answers);

    expect(aliases['@utils/*']).toBe('./src/shared/utils/*');
    expect(Object.keys(aliases)[0]).toBe('@pages/*');
  });

  it('carries the target-only aliases through all three consumers', () => {
    const answers = answersFor({ target: 'next' });
    const { paths } = buildTsconfig(answers).compilerOptions;

    const expected = ['./src/lib/server/*'];
    expect(paths?.['@server/*']).toEqual(expected);
    const content = ['./src/content/*'];
    expect(paths?.['@content/*']).toEqual(content);
    expect(buildAliases(answers)['@server/*']).toBe('./src/lib/server/*');
    const eslintConfig = emitEslintConfig(answers);
    expect(eslintConfig).toContain("'@content/*': './src/content/*',");
  });

  it('gives them to no other target', () => {
    const others = TARGET_IDS
      .filter((target) => {
        return target !== 'next';
      });

    for (const target of others) {
      const { compilerOptions: { paths } } = buildTsconfig(answersFor({ target }));

      expect(paths ?? {}).not.toHaveProperty('@server/*');
      expect(paths ?? {}).not.toHaveProperty('@content/*');
    }
  });

  it("resolves react native's hooks and Expo's aliases where its tree keeps them", () => {
    const { compilerOptions: { paths } } = buildTsconfig(answersFor({ target: 'react-native' }));

    const hooks = ['./src/hooks/*'];
    expect(paths?.['@hooks/*']).toEqual(hooks);
    const assets = ['./assets/*'];
    expect(paths?.['@/assets/*']).toEqual(assets);
    const source = ['./src/*'];
    expect(paths?.['@/*']).toEqual(source);
  });

  it("matches the extension target's own documented layout", () => {
    const { compilerOptions: { paths } } = buildTsconfig(answersFor({ target: 'webextension' }));

    const expected = ['./src/lib/model/*'];
    expect(paths?.['@model/*']).toEqual(expected);
    expect(paths).not.toHaveProperty('@store/*');
    expect(paths).not.toHaveProperty('@providers/*');

    const react = buildTsconfig(answersFor({ target: 'react' }));

    expect(react.compilerOptions.paths).toHaveProperty('@store/*');
    expect(react.compilerOptions.paths).not.toHaveProperty('@providers/*');
  });

  it('extends what SvelteKit generates, and keeps the kit types its own types would replace', () => {
    const config = buildTsconfig(answersFor({ target: 'svelte' }));

    expect(config.extends).toBe('$app/tsconfig');
    expect(config.compilerOptions.types).toContain('$app/types');
    expect(config.compilerOptions.paths).not.toHaveProperty('$lib');
    const react = buildTsconfig(answersFor({ target: 'react' }));
    expect(react.extends).toBeUndefined();
  });
});

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
    const { compilerOptions } = buildTsconfig(answersFor({
      target: 'webextension',
      hostedFramework: 'vue',
    }));

    expect(compilerOptions).not.toHaveProperty('jsx');

    const frameworkless = buildTsconfig(answersFor({ target: 'webextension' }));
    expect(frameworkless.compilerOptions).not.toHaveProperty('jsx');
  });
});

describe('tsconfigEmitter', () => {
  it('writes the emitted text to tsconfig.json at the package stage', () => {
    const tsconfig = tsconfigEmitter(answersFor({}));
    const text = emitTsconfig(answersFor({}));
    const expected = [{
      stage: 'package',
      target: 'tsconfig.json',
      content: { text },
    }];
    expect(tsconfig).toEqual(expected);
  });
});
