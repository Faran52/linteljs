import { targetFor } from '../../model/targets';

import type { Answers } from '../../model/answers/answers';
import type { PluginSpec, TestPlatform } from '../../model/targets/record';

// Merges onto `vite.config.ts` on a Vite target, since a standalone config has no framework plugin. `./vite.config.js`
// on purpose: extensionless, Vite warns on every run; `.ts` hits TS5097; `.js` resolves to the `.ts` under `bundler`.

// The entry exclusion matches only at the root of `src/`, so a `src/lib/index.ts` barrel still counts.
const SHARED_COVERAGE_EXCLUDE = [
  '**/*.test.*',
  '**/*.d.ts',
  'src/typings/**',
  'src/{main,index}.{ts,tsx}',
];

// A bare `src/**` hands rolldown `src/app.html` and friends, each printing a parse failure while the gate passes.
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

// One entry per line: `max-len` has no fixer.
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

// `resolve.extensions` makes `foo.web.tsx` outrank `foo.tsx` as Metro does; without the second project `.web`
// modules sit at zero coverage. `environment: 'node'`, since React Native renders through a test renderer.
const platformProjects = (
  platforms: TestPlatform[],
  include: string,
  exclude: string[],
  setup: string,
): string => {
  // One argument per line: the extension lists run past `max-len`.
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

const mergedConfig = (block: string, testConditions: string[] | undefined): string => {
  const conditions = testConditions === undefined
    ? ''
    : `  resolve: { conditions: [${quoted(testConditions)}] },\n`;

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
};

// A standalone config inherits no resolution; measured on a real Next project, 27 of 36 suites failed on the
// import line without `tsconfigPaths`.
const standaloneConfig = (block: string, vitestPlugin: PluginSpec | undefined): string => {
  const pluginImports = vitestPlugin === undefined ? '' : `${vitestPlugin.imports.join('\n')}\n`;
  const plugins = vitestPlugin === undefined
    ? ''
    : `  plugins: [${vitestPlugin.calls.join(', ')}],\n`;

  return `${pluginImports}import { defineConfig } from 'vitest/config';

export default defineConfig({
${plugins}  resolve: { tsconfigPaths: true },
${block}
});
`;
};

export const emitVitestConfig = (answers: Answers, setup: string): string | null => {
  if (answers.testing !== 'vitest') {
    return null;
  }

  const target = targetFor(answers);
  const include = coverageInclude(target.sfcExtension);
  // A route table is configuration; the generated tree is the plugin's.
  const exclude = [
    ...SHARED_COVERAGE_EXCLUDE,
    ...target.coverageExclude ?? [],
    ...(answers.router === undefined ? [] : ['src/routes/**', 'src/routeTree.gen.ts']),
  ];

  if (target.testPlatforms !== undefined) {
    return platformProjects(target.testPlatforms, include, exclude, setup);
  }

  const block = testBlock(include, exclude, setup);

  if (target.vite) {
    return mergedConfig(block, target.testConditions);
  }

  // Astro's `getViteConfig` is the only way to reach its Vite config when there is no `vite.config.ts` to merge.
  if (target.vitestFactory !== undefined) {
    return `${target.vitestFactory.imports.join('\n')}

export default ${target.vitestFactory.call}({
${block}
});
`;
  }

  return standaloneConfig(block, target.vitestPlugin);
};
