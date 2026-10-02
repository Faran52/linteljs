import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import {
  type PluginSpec,
  targetFor,
  type TestPlatform,
} from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { setupTestsPath } from '../../utils/shapeUtils';
import { type StylingPlugin, stylingPlugin } from '../../utils/stylingUtils';

import { platformEntries, quoted } from './utils/platformUtils';

// `./vite.config.js`: extensionless, Vite warns every run; `.ts` hits TS5097; `.js` resolves to the `.ts`.

// Root of `src/` only, so a `src/lib/index.ts` barrel still counts.
const SHARED_COVERAGE_EXCLUDE = [
  '**/*.test.*',
  '**/*.d.ts',
  'src/typings/**',
  'src/{main,index}.{ts,tsx}',
  // Compiled to CSS by the bundler, so nothing of it is left at runtime.
  '**/*.stylex.{ts,tsx}',
  // An `.astro` component has no vitest renderer, so a module only one imports is unreachable by any suite.
  '**/components/**/styles.{ts,tsx}',
];

// A bare `src/**` hands rolldown `src/app.html`, printing a parse failure while the gate passes.
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

// One entry per line: `max-len` has no fixer.
const excludeList = (exclude: string[], indent: string): string => {
  return exclude
    .map((value) => {
      return `\n${indent}    '${value}',`;
    })
    .join('');
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

// Node 25+ `localStorage` throws without `--localstorage-file`; this hands the global back to happy-dom.
// https://github.com/capricorn86/happy-dom/issues/1950
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

// React Native renders through a test renderer, not a DOM; `resolve.extensions` is Metro's own order.
const platformProjects = (
  platforms: TestPlatform[],
  include: string,
  exclude: string[],
  setup: string,
): string => {
  return `import { reactNative } from '@srsholmes/vitest-react-native';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const platform = (name: string, extensions: string[], include: string[]) => {
  const project = {
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

  return project;
};

export default defineConfig({
  test: {
    projects: [
${platformEntries(platforms)}
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

// A standalone config inherits no resolution: 27 of 36 suites failed on a real Next project without it.
// Next compiles StyleX through Babel, which vitest never reaches, so the plugin is added here.
const standaloneConfig = (block: string, vitestPlugin: PluginSpec | undefined, stylex: StylingPlugin): string => {
  const calls = [...stylex.call === undefined ? [] : [stylex.call], ...vitestPlugin?.calls ?? []];
  const pluginImports = sortedImports([...vitestPlugin?.imports ?? [], ...stylex.imports]);
  const plugins = calls.length === 0 ? '' : `  plugins: [${calls.join(', ')}],\n`;
  const prelude = pluginImports === '' ? '' : `${pluginImports}\n`;
  const declarations = stylex.declarations.length === 0 ? '' : `\n${stylex.declarations.join('\n')}\n`;

  return `${prelude}import { defineConfig } from 'vitest/config';
${declarations}
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
  // React Router's route table is configuration; TanStack Router builds its tree in `App.tsx`.
  const exclude = [
    ...SHARED_COVERAGE_EXCLUDE,
    ...target.coverageExclude ?? [],
    ...(answers.router === undefined || answers.router === 'tanstack-router' ? [] : ['src/routes/**']),
  ];

  if (target.testPlatforms !== undefined) {
    return platformProjects(target.testPlatforms, include, exclude, setup);
  }

  if (target.vitePlugin !== undefined) {
    const nestedBlock = testBlock(include, exclude, setup, '    ', target.testPool);

    return mergedConfig(nestedBlock, target.testConditions);
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

// Birth only: the excludes are layout guesses a project replaces with its own.
export const vitestConfigEmitter = (answers: Answers, project: ProjectShape): Artifact[] => {
  const config = emitVitestConfig(answers, setupTestsPath(answers, project.setupTests));

  if (config === null) {
    return [];
  }

  const artifacts: Artifact[] = [{
    ...emitted('standard', 'vitest.config.ts', config),
    preserve: true,
  }];

  return artifacts;
};
