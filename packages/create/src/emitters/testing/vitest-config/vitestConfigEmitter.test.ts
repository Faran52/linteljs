import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';

import { setupTestsPath } from '../../utils/shapeUtils';

import { emitVitestConfig, vitestConfigEmitter } from './vitestConfigEmitter';

import type {
  Data,
  Router,
  Styling,
  Surface,
  TargetId,
  Testing,
} from '@config/types';

interface AnswerOverrides {
  target?: TargetId;
  testing?: Testing;
  router?: Router;
  styling?: Styling;
  data?: Data;
  surfaces?: Surface[];
}

const configFor = (overrides: AnswerOverrides = {}): string | null => {
  const answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };

  return emitVitestConfig(answers, setupTestsPath(answers));
};

const MERGED = `import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./__mocks__/setupTests.tsx'],
      execArgv: ['--no-experimental-webstorage'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}'],
        exclude: [
          '**/*.test.*',
          '**/*.d.ts',
          'src/typings/**',
          'src/{main,index}.{ts,tsx}',
          '**/*.stylex.{ts,tsx}',
          '**/components/**/styles.{ts,tsx}',
        ],
        thresholds: {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  }),
);
`;

const STANDALONE = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./__mocks__/setupTests.tsx'],
    execArgv: ['--no-experimental-webstorage'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        'src/typings/**',
        'src/{main,index}.{ts,tsx}',
        '**/*.stylex.{ts,tsx}',
        '**/components/**/styles.{ts,tsx}',
        'src/app/layout.tsx',
        'src/app/global-error.tsx',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
`;

const WITH_PLUGIN_AND_POOL = `import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular({ tsconfig: './tsconfig.json' })],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'happy-dom',
    pool: 'forks',
    setupFiles: ['./__mocks__/setupTests.ts'],
    execArgv: ['--no-experimental-webstorage'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        'src/typings/**',
        'src/{main,index}.{ts,tsx}',
        '**/*.stylex.{ts,tsx}',
        '**/components/**/styles.{ts,tsx}',
        'src/app/app.config.ts',
        'src/app/app.routes.ts',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
`;

const FACTORY = `import { getViteConfig } from 'astro/config';

import 'vitest/config';

export default getViteConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./__mocks__/setupTests.ts'],
    execArgv: ['--no-experimental-webstorage'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        'src/typings/**',
        'src/{main,index}.{ts,tsx}',
        '**/*.stylex.{ts,tsx}',
        '**/components/**/styles.{ts,tsx}',
        'src/config/**',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
`;

const PLATFORMS = `import { reactNative } from '@srsholmes/vitest-react-native';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const platform = (name: string, extensions: string[], include: string[]) => {
  return {
    plugins: [react(), reactNative()],
    resolve: {
      tsconfigPaths: true,
      extensions,
    },
    test: {
      name,
      include,
      globals: true,
      environment: 'node',
      setupFiles: ['./__mocks__/setupTests.tsx'],
    },
  };
};

export default defineConfig({
  test: {
    projects: [
      platform(
        'native',
        [
          '.ios.tsx',
          '.ios.ts',
          '.native.tsx',
          '.native.ts',
          '.tsx',
          '.ts',
          '.jsx',
          '.js',
          '.json',
        ],
        ['src/**/*.test.{ts,tsx}'],
      ),
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs}'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        'src/typings/**',
        'src/{main,index}.{ts,tsx}',
        '**/*.stylex.{ts,tsx}',
        '**/components/**/styles.{ts,tsx}',
        'src/app/_layout.tsx',
        'src/config/routes.ts',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
`;

describe('emitVitestConfig', () => {
  it('names the stylex plugin where there is no vite config to inherit one from', () => {
    const config = configFor({
      target: 'next',
      styling: 'stylex',
    });

    expect(config).toContain("import stylexVite from '@stylexjs/unplugin/vite';");
    expect(config).toContain(`import { defineConfig } from 'vitest/config';

const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;

export default defineConfig({
  plugins: [stylex({ useCSSLayers: { before: ['reset'] } })],
`);
    const nuxt = configFor({
      target: 'nuxt',
      styling: 'stylex',
    });

    expect(nuxt).toContain("import vue from '@vitejs/plugin-vue';");
    expect(nuxt).toContain("  plugins: [stylex({ useCSSLayers: { before: ['reset'] } }), vue()],\n");
  });
  it('writes nothing when testing is declined', () => {
    expect(configFor({ testing: 'none' })).toBeNull();
  });

  it.each<[string, TargetId, string]>([
    [
      'merges the vite config where the target builds with vite',
      'react',
      MERGED,
    ],
    [
      'stands alone, with no plugin, where there is no vite config and no plugin to add',
      'next',
      STANDALONE,
    ],
    [
      'carries the compiler plugin and its pool where no vite config is merged',
      'angular',
      WITH_PLUGIN_AND_POOL,
    ],
    [
      "borrows the target's own resolved config through its factory",
      'astro',
      FACTORY,
    ],
    [
      'runs React Native as a platform project of its own',
      'react-native',
      PLATFORMS,
    ],
  ])('%s', (_shape, target, expected) => {
    expect(configFor({ target })).toBe(expected);
  });

  it('names the setup file the artifact list writes', () => {
    expect(configFor()).toContain("setupFiles: ['./__mocks__/setupTests.tsx']");
    expect(configFor({ target: 'react-native' })).toContain("setupFiles: ['./__mocks__/setupTests.tsx']");
  });

  it('covers the single-file component extension where the target has one', () => {
    expect(configFor({ target: 'vue' })).toContain(',vue}');
    expect(configFor({ target: 'nuxt' })).toContain(',vue}');
    expect(configFor({ target: 'react' })).not.toContain('vue');
  });

  it('disables native web storage for every happy-dom target', () => {
    for (const target of [
      'react',
      'next',
      'vue',
      'angular',
      'svelte',
      'solid',
      'webextension',
    ] as const) {
      expect(configFor({ target })).toContain("execArgv: ['--no-experimental-webstorage'],");
    }

    expect(configFor({ target: 'react-native' })).not.toContain('execArgv');
  });

  it.each<[TargetId, string]>([
    ['svelte', "resolve: { conditions: ['browser'] },"],
    ['solid', "resolve: { conditions: ['development', 'browser'] },"],
  ])('gives %s the resolve conditions its runtime needs', (target, expected) => {
    expect(configFor({ target })).toContain(expected);
  });

  it.each<TargetId>([
    'react',
    'next',
    'vue',
    'angular',
    'webextension',
  ])(
    'leaves %s on the default resolution',
    (target) => {
      expect(configFor({ target })).not.toContain('conditions');
    },
  );

  it.each<TargetId>(['next', 'angular'])(
    'resolves the tsconfig aliases for %s, which has no vite config to merge',
    (target) => {
      expect(configFor({ target })).toContain('resolve: { tsconfigPaths: true },');
    },
  );
});

describe('the styling system', () => {
  it('keeps a StyleX token table out of coverage', () => {
    expect(configFor({ styling: 'stylex' })).toContain("'**/*.stylex.{ts,tsx}'");
  });
});

describe('the router', () => {
  it('keeps the route table out of coverage', () => {
    expect(configFor({ router: 'react-router' })).toContain("'src/routes/**'");
    expect(configFor({})).not.toContain('src/routes/**');
  });

  it('excludes nothing for TanStack Router', () => {
    const config = configFor({ router: 'tanstack-router' });

    expect(config).not.toContain('src/routes/**');
    expect(config).not.toContain('routeTree');
  });
});

describe('vitestConfigEmitter', () => {
  it('hands the config to the project after the first write', () => {
    expect(vitestConfigEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT)).toEqual([{
      stage: 'standard',
      target: 'vitest.config.ts',
      content: { text: MERGED },
      preserve: true,
    }]);
  });

  it('writes nothing when testing is declined', () => {
    const artifacts = vitestConfigEmitter({
      ...DEFAULT_ANSWERS,
      testing: 'none',
    }, EMPTY_PROJECT);

    expect(artifacts).toEqual([]);
  });
});

describe('the coverage surface', () => {
  it('never counts the bootstrap entry, whose only assertion is about the framework', () => {
    expect(configFor()).toContain("'src/{main,index}.{ts,tsx}'");
  });

  it.each<[TargetId, string]>([
    ['react', ''],
    ['svelte', ',svelte'],
    ['vue', ',vue'],
  ])('measures only what v8 can instrument on %s, plus its component format', (target, format) => {
    expect(configFor({ target })).toContain(`include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs${format}}']`);
  });

  it.each<[string, AnswerOverrides, string[]]>([
    [
      'react',
      { target: 'react' },
      [],
    ],
    [
      'react in framework mode',
      {
        target: 'react',
        router: 'react-router-framework',
      },
      ['src/root.tsx', 'src/routes/**'],
    ],
    [
      'next',
      { target: 'next' },
      ['src/app/layout.tsx', 'src/app/global-error.tsx'],
    ],
    [
      'vue',
      { target: 'vue' },
      [],
    ],
    [
      'nuxt',
      { target: 'nuxt' },
      [],
    ],
    [
      'svelte',
      { target: 'svelte' },
      ['src/routes/+layout.svelte'],
    ],
    [
      'solid',
      { target: 'solid' },
      [],
    ],
    [
      'angular',
      { target: 'angular' },
      ['src/app/app.config.ts', 'src/app/app.routes.ts'],
    ],
    [
      'astro',
      { target: 'astro' },
      ['src/config/**'],
    ],
    [
      'webextension',
      { target: 'webextension' },
      ['src/background/index.ts'],
    ],
    [
      'a webextension with a popup alone',
      {
        target: 'webextension',
        surfaces: ['popup'],
      },
      [],
    ],
    [
      'a webextension with a devtools panel',
      {
        target: 'webextension',
        surfaces: ['devtools-panel'],
      },
      [
        'src/config/linteljs.ts',
        'src/devtools/index.ts',
        'src/panel/index.ts',
      ],
    ],
    [
      'react-native',
      { target: 'react-native' },
      ['src/app/_layout.tsx', 'src/config/routes.ts'],
    ],
  ])('leaves out of coverage on %s only what it cannot execute', (_label, overrides, excluded) => {
    const [, block = ''] = /coverage: \{[\s\S]*?exclude: \[([^\]]*)\]/u.exec(configFor(overrides) ?? '') ?? [];

    const entries = [...block.matchAll(/'([^']+)'/gu)]
      .map(([, entry]) => {
        return entry;
      });

    expect(entries).toEqual([
      '**/*.test.*',
      '**/*.d.ts',
      'src/typings/**',
      'src/{main,index}.{ts,tsx}',
      '**/*.stylex.{ts,tsx}',
      '**/components/**/styles.{ts,tsx}',
      ...excluded,
    ]);
  });

  it.each(valuesOf(ANSWERS.target.values))('keeps the thresholds at 100 on %s', (target) => {
    expect(configFor({ target }))
      .toMatch(/thresholds: \{\s*lines: 100,\s*branches: 100,\s*functions: 100,\s*statements: 100,\s*\}/u);
  });
});
