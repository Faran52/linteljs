import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { keysOf } from '@utils/objectUtils';

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

  const setupPath = setupTestsPath(answers);

  return emitVitestConfig(answers, setupPath);
};

const VITEST_TARGETS = keysOf(ANSWERS.target.values)
  .filter((target) => {
    return target !== 'react-native';
  });

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

describe('emitVitestConfig', () => {
  it('names the stylex plugin where there is no vite config to inherit one from', () => {
    const config = configFor({
      target: 'next',
      styling: 'stylex',
    });

    expect(config).toContain("import stylexVite from '@stylexjs/unplugin/vite';");

    expect(config).toContain(`import { defineConfig } from 'vitest/config';

const stylex: (options: Partial<UserOptions>) => VitePlugin = stylexVite;
const stylexAliases = { '@styles/*': [\`\${import.meta.dirname}/src/styles/*\`] };

export default defineConfig({
  plugins: [stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } })],
`);

    const nuxt = configFor({
      target: 'nuxt',
      styling: 'stylex',
    });

    expect(nuxt).toContain("import vue from '@vitejs/plugin-vue';");
    const plugins = "  plugins: [stylex({ aliases: stylexAliases, useCSSLayers: { before: ['reset'] } }), vue()],\n";

    expect(nuxt).toContain(plugins);
  });

  it('writes nothing when testing is declined', () => {
    const config = configFor({ testing: 'none' });
    expect(config).toBeNull();
  });

  it('writes nothing for a target whose suites run on jest', () => {
    const config = configFor({ target: 'react-native' });
    expect(config).toBeNull();
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
  ])('%s', (_shape, target, expected) => {
    const config = configFor({ target });
    expect(config).toBe(expected);
  });

  it('names the setup file the artifact list writes', () => {
    const config = configFor();
    expect(config).toContain("setupFiles: ['./__mocks__/setupTests.tsx']");
  });

  it('covers the single-file component extension where the target has one', () => {
    const vueConfig = configFor({ target: 'vue' });
    expect(vueConfig).toContain(',vue}');
    const nuxtConfig = configFor({ target: 'nuxt' });
    expect(nuxtConfig).toContain(',vue}');
    const reactConfig = configFor({ target: 'react' });
    expect(reactConfig).not.toContain('vue');
  });

  it('disables native web storage for every happy-dom target', () => {
    const happyDomTargets = [
      'react',
      'next',
      'vue',
      'angular',
      'svelte',
      'solid',
      'webextension',
    ] as const;

    for (const target of happyDomTargets) {
      const config = configFor({ target });
      expect(config).toContain("execArgv: ['--no-experimental-webstorage'],");
    }
  });

  it.each<[TargetId, string]>([
    ['svelte', "resolve: { conditions: ['browser'] },"],
    ['solid', "resolve: { conditions: ['development', 'browser'] },"],
  ])('gives %s the resolve conditions its runtime needs', (target, expected) => {
    const config = configFor({ target });
    expect(config).toContain(expected);
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
      const config = configFor({ target });
      expect(config).not.toContain('conditions');
    },
  );

  it.each<TargetId>(['next', 'angular'])(
    'resolves the tsconfig aliases for %s, which has no vite config to merge',
    (target) => {
      const config = configFor({ target });
      expect(config).toContain('resolve: { tsconfigPaths: true },');
    },
  );
});

describe('the styling system', () => {
  it('keeps a StyleX token table out of coverage', () => {
    const config = configFor({ styling: 'stylex' });
    expect(config).toContain("'**/*.stylex.{ts,tsx}'");
  });
});

describe('the router', () => {
  it('keeps the route table out of coverage', () => {
    const routedConfig = configFor({ router: 'react-router' });
    expect(routedConfig).toContain("'src/routes/**'");
    const plainConfig = configFor({});
    expect(plainConfig).not.toContain('src/routes/**');
  });

  it('excludes nothing for TanStack Router', () => {
    const config = configFor({ router: 'tanstack-router' });

    expect(config).not.toContain('src/routes/**');
    expect(config).not.toContain('routeTree');
  });
});

describe('vitestConfigEmitter', () => {
  it('hands the config to the project after the first write', () => {
    const artifacts = vitestConfigEmitter(DEFAULT_ANSWERS, EMPTY_PROJECT);
    const expected = [{
      stage: 'standard',
      target: 'vitest.config.ts',
      content: { text: MERGED },
      preserve: true,
    }];
    expect(artifacts).toEqual(expected);
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
    const config = configFor();
    expect(config).toContain("'src/{main,index}.{ts,tsx}'");
  });

  it.each<[TargetId, string]>([
    ['react', ''],
    ['svelte', ',svelte'],
    ['vue', ',vue'],
  ])('measures only what v8 can instrument on %s, plus its component format', (target, format) => {
    const config = configFor({ target });
    expect(config).toContain(`include: ['src/**/*.{ts,tsx,mts,js,jsx,mjs${format}}']`);
  });

  it.each(VITEST_TARGETS)('keeps the thresholds at 100 on %s', (target) => {
    const config = configFor({ target });

    expect(config)
      .toMatch(/thresholds: \{\s*lines: 100,\s*branches: 100,\s*functions: 100,\s*statements: 100,\s*\}/u);
  });
});
