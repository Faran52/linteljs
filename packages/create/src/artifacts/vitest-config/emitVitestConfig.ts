import { targetFor } from '../../model/targets';

import type { Answers } from '../../model/answers/answers';
import type { TestPlatform } from '../../model/targets/record';

/**
 * Emits `vitest.config.ts`. On a Vite target it merges onto `vite.config.ts` rather than standing alone: a
 * standalone config has no framework plugin, so the first test importing a `.vue`, `.svelte` or `.tsx` component
 * fails to transform it. `./vite.config.js` names `vite.config.ts` on purpose, and both halves are load-bearing:
 * extensionless, Vite warns on every run; written as `.ts`, it hits TS5097 because the emitted tsconfig leaves
 * `allowImportingTsExtensions` off; `.js` under `moduleResolution: bundler` resolves to the `.ts` file and
 * satisfies both.
 */

// Coverage exclusions every target shares; the bootstrap-entry exclusion matches only at the root of `src/`, so a
// `src/lib/index.ts` barrel still counts. Targets add rather than replace.
const SHARED_COVERAGE_EXCLUDE = [
  '**/*.test.*',
  '**/*.d.ts',
  'src/typings/**',
  'src/{main,index}.{ts,tsx}',
];

/**
 * Extensions v8 can instrument, plus the target's own component format. A bare `src/**` hands rolldown every file
 * under `src/` (e.g. `src/app.html` on Svelte), each throwing `Error [RolldownError]: Parse failed` while coverage
 * still comes out correct and `pnpm check` exits 0 with just a stray stack trace.
 */
const MEASURABLE = [
  'ts',
  'tsx',
  'mts',
  'js',
  'jsx',
  'mjs',
];

const coverageInclude = (sfcExtension?: string): string => {
  const extensions = sfcExtension === undefined ? MEASURABLE : [...MEASURABLE, sfcExtension];

  return `src/**/*.{${extensions.join(',')}}`;
};

const quoted = (values: string[]): string => {
  return values.map((value) => {
    return `'${value}'`;
  }).join(', ');
};

// One entry per line: the list grows per target, and `max-len` has no fixer.
const excludeList = (exclude: string[]): string => {
  return exclude.map((value) => {
    return `\n        '${value}',`;
  }).join('');
};

const coverageBlock = (include: string, exclude: string[], indent: string): string => {
  return `${indent}coverage: {
${indent}  provider: 'v8',
${indent}  include: ['${include}'],
${indent}  exclude: [${excludeList(exclude)}
${indent}  ],
${indent}  thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
${indent}},`;
};

const testBlock = (include: string, exclude: string[], setup: string): string => {
  return `  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./${setup}'],
${coverageBlock(include, exclude, '    ')}
  },`;
};

/**
 * One project per platform: `resolve.extensions` tells Vite that `foo.web.tsx` outranks `foo.tsx` (the order Metro
 * applies at build time), and without the second project `.web` modules sit at zero coverage while the suite still
 * passes. `environment: 'node'`, not `happy-dom`: React Native renders through a test renderer, not a document, and
 * the adapter stands in for the native modules underneath it.
 */
const platformProjects = (
  platforms: TestPlatform[],
  include: string,
  exclude: string[],
  setup: string,
): string => {
  // One argument per line: the extension lists run past `max-len` on a single one.
  const entries = platforms.map((platform) => {
    const lines = [
      `        '${platform.name}',`,
      `        [${quoted(platform.extensions)}],`,
      `        [${quoted(platform.include)}],`,
      ...(platform.exclude === undefined ? [] : [`        [${quoted(platform.exclude)}],`]),
    ];

    return `      platform(\n${lines.join('\n')}\n      ),`;
  });

  return `import { reactNative } from '@srsholmes/vitest-react-native';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const platform = (name: string, extensions: string[], include: string[], exclude: string[] = []) => {
  return {
    plugins: [react(), reactNative()],
    resolve: { tsconfigPaths: true, extensions },
    test: {
      name,
      include,
      exclude,
      globals: true,
      environment: 'node',
      setupFiles: ['./${setup}'],
    },
  };
};

export default defineConfig({
  test: {
    projects: [
${entries.join('\n')}
    ],
${coverageBlock(include, exclude, '    ')}
  },
});
`;
};

export const emitVitestConfig = (answers: Answers, setup: string): string | null => {
  if (answers.testing !== 'vitest') {
    return null;
  }

  const target = targetFor(answers);
  const include = coverageInclude(target.sfcExtension);
  const exclude = [...SHARED_COVERAGE_EXCLUDE, ...target.coverageExclude ?? []];

  if (target.testPlatforms !== undefined) {
    return platformProjects(target.testPlatforms, include, exclude, setup);
  }

  const block = testBlock(include, exclude, setup);
  const conditions = target.testConditions === undefined
    ? ''
    : `  resolve: { conditions: [${quoted(target.testConditions)}] },\n`;

  if (target.vite) {
    return `import {
  defineConfig,
  mergeConfig,
} from 'vitest/config';

import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
${conditions}${block}
  }),
);
`;
  }

  // A factory instead of `defineConfig`: Astro's `getViteConfig` resolves `astro.config.mjs` and hands the test run the
  // same Vite config the build uses, which is the only way to reach it when there is no `vite.config.ts` to merge.
  const { vitestFactory } = target;

  if (vitestFactory !== undefined) {
    return `${vitestFactory.imports.join('\n')}

export default ${vitestFactory.call}({
${block}
});
`;
  }

  const { vitestPlugin } = target;
  const pluginImports = vitestPlugin === undefined ? '' : `${vitestPlugin.imports.join('\n')}\n`;
  const plugins = vitestPlugin === undefined
    ? ''
    : `  plugins: [${vitestPlugin.calls.join(', ')}],\n`;

  /**
   * A standalone config inherits no resolution, so the aliases are declared here: the merge branch above takes them
   * from `vite.config.ts` and the platform projects declare their own. Without this every alias the CLI writes into
   * `tsconfig.json` is unresolvable from a test, which on Next is the whole set including `@mocks/*`. Measured on a
   * real project: 27 of 36 suites failed on the import line alone. Unconditional rather than composed with
   * `conditions`, since no target reaching here declares any.
   */
  return `${pluginImports}import { defineConfig } from 'vitest/config';

export default defineConfig({
${plugins}  resolve: { tsconfigPaths: true },
${block}
});
`;
};
