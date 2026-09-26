import { type Artifact, type ProjectShape } from '@config/types';

import { targetFor } from '@targets';

import { setupTestsPath } from '../../always/banned-patterns/bannedPatternsEmitter';
import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { stylingPlugin } from '../../utils/stylingUtils';

import type { Answers } from '@answers';
import type { PluginSpec, TestPlatform } from '@targets/types';

// Merges onto `vite.config.ts` on a Vite target, since a standalone config has no framework plugin. `./vite.config.js`
// on purpose: extensionless, Vite warns on every run; `.ts` hits TS5097; `.js` resolves to the `.ts` under `bundler`.

// The entry exclusion matches only at the root of `src/`, so a `src/lib/index.ts` barrel still counts.
const SHARED_COVERAGE_EXCLUDE = [
  '**/*.test.*',
  '**/*.d.ts',
  'src/typings/**',
  'src/{main,index}.{ts,tsx}',
  // A StyleX token table is compiled to CSS by the bundler, so at runtime there is nothing of it left to measure.
  '**/*.stylex.{ts,tsx}',
  /*
   * A component's style module, which is the same kind of thing one level down: a declaration of rules, compiled
   * to atomic classes under StyleX and a table of class names otherwise. Astro is what settles it rather than
   * taste: an `.astro` component has no vitest renderer, so a module only an `.astro` file imports cannot be
   * reached by any suite that could be written.
   */
  '**/components/**/styles.{ts,tsx}',
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

// One entry per line: `max-len` has no fixer. Two levels below the block, which the merged config nests one deeper.
const excludeList = (exclude: string[], indent: string): string => {
  return exclude.map((value) => {
    return `\n${indent}    '${value}',`;
  }).join('');
};

const coverageBlock = (include: string, exclude: string[], indent: string): string => {
  return `${indent}coverage: {
${indent}  provider: 'v8',
${indent}  include: ['${include}'],
${indent}  exclude: [${excludeList(exclude, indent)}
${indent}  ],
${indent}  thresholds: {
${indent}    lines: 100,
${indent}    branches: 100,
${indent}    functions: 100,
${indent}    statements: 100,
${indent}  },
${indent}},`;
};

/*
 * `execArgv`: Node 25+ exposes a native `localStorage` that throws without
 * `--localstorage-file`, and happy-dom stopped replacing it, so a storage-backed
 * component test reads `undefined`. Turning the native one off hands the global
 * back to happy-dom's shim. https://github.com/capricorn86/happy-dom/issues/1950
 * Unconditional: Node accepts the flag from 22.4, below `NODE_ENGINE`, and
 * on a release without native storage it turns off nothing.
 */
const testBlock = (
  include: string,
  exclude: string[],
  setup: string,
  indent: string,
  pool?: string,
): string => {
  return `${indent}test: {
${indent}  globals: true,
${indent}  environment: 'happy-dom',
${pool === undefined ? '' : `${indent}  pool: '${pool}',\n`}${indent}  setupFiles: ['./${setup}'],
${indent}  execArgv: ['--no-experimental-webstorage'],
${coverageBlock(include, exclude, `${indent}  `)}
${indent}},`;
};

/*
 * One project, and the only one this CLI writes by hand: React Native needs its own transform, its own module
 * resolution and a `node` environment, since it renders through a test renderer rather than a DOM.
 *
 * `resolve.extensions` is Metro's own order, so a `.ios` or `.native` module outranks the plain one the way it
 * does at runtime.
 */
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
    ];

    return `      platform(\n${lines.join('\n')}\n      ),`;
  });

  return `import { reactNative } from '@srsholmes/vitest-react-native';
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
    : `    resolve: { conditions: [${quoted(testConditions)}] },\n`;

  return `import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
${conditions}${block}
  }),
);
`;
};

/*
 * A standalone config inherits no resolution; measured on a real Next project, 27 of 36 suites failed on the
 * import line without `tsconfigPaths`.
 *
 * StyleX is added here rather than left to the target's own build. A target with a Vite config gets the plugin
 * through it, and this is the shape for one that has none: Next compiles through Babel and PostCSS, which a
 * vitest run never reaches, so without the plugin every suite fails on an uncompiled `defineVars`.
 */
const standaloneConfig = (block: string, vitestPlugin: PluginSpec | undefined, stylex: PluginSpec): string => {
  const calls = [...stylex.calls, ...vitestPlugin?.calls ?? []];
  const pluginImports = sortedImports([...vitestPlugin?.imports ?? [], ...stylex.imports]);
  const plugins = calls.length === 0 ? '' : `  plugins: [${calls.join(', ')}],\n`;
  const prelude = pluginImports === '' ? '' : `${pluginImports}\n`;

  return `${prelude}import { defineConfig } from 'vitest/config';

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

  if (target.vitePlugin !== undefined) {
    return mergedConfig(testBlock(include, exclude, setup, '    ', target.testPool), target.testConditions);
  }

  const block = testBlock(include, exclude, setup, '  ', target.testPool);

  // Astro's `getViteConfig` is the only way to reach its Vite config when there is no `vite.config.ts` to merge.
  if (target.vitestFactory !== undefined) {
    return `${target.vitestFactory.imports.join('\n')}

export default ${target.vitestFactory.call}({
${block}
});
`;
  }

  const stylex = stylingPlugin(answers.styling === 'stylex' ? 'stylex' : undefined);

  return standaloneConfig(block, target.vitestPlugin, stylex);
};

// Birth only, for the same reason `vite.config.ts` is. The excludes name this CLI's layout guesses, which a
// project replaces with its own.
export const vitestConfigEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  const config = emitVitestConfig(answers, setupTestsPath(answers, project.setupTests));

  return config === null
    ? []
    : [{
        ...emitted('standard', 'vitest.config.ts', config),
        preserve: true,
      }];
};
