import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import {
  type PluginSpec,
  type PluginSwap,
  targetFor,
  type TargetRecord,
} from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { sortedImports } from '../../utils/importUtils';
import { testRunnerOf } from '../../utils/runnerUtils';
import { setupTestsPath } from '../../utils/shapeUtils';
import { type StylingPlugin, stylingPlugin } from '../../utils/stylingUtils';
import { coverageExclude, coverageInclude } from '../utils/coverageUtils';

const quoted = (values: string[]): string => {
  return values
    .map((value) => {
      return `'${value}'`;
    })
    .join(', ');
};

// `./vite.config.js`: extensionless, Vite warns every run; `.ts` hits TS5097; `.js` resolves to the `.ts`.

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
  target: TargetRecord,
): string => {
  const { testPool: pool } = target;
  const dom = target.libraryProject !== true;
  const poolLine = pool === undefined ? '' : `${indent}  pool: '${pool}',\n`;
  const execArgvLine = dom ? `${indent}  execArgv: ['--no-experimental-webstorage'],\n` : '';
  const inlineLine = target.testInline === undefined
    ? ''
    : `${indent}  server: { deps: { inline: [${target.testInline
      .map(String)
      .join(', ')}] } },\n`;

  return `${indent}test: {
${indent}  globals: true,
${indent}  environment: '${dom ? 'happy-dom' : 'node'}',
${poolLine}${inlineLine}${indent}  setupFiles: ['./${setup}'],
${execArgvLine}${coverageBlock(include, exclude, `${indent}  `)}
${indent}},`;
};

const conditionsLine = (testConditions: string[] | undefined, indent: string): string => {
  return testConditions === undefined ? '' : `${indent}resolve: { conditions: [${quoted(testConditions)}] },\n`;
};

const mergedConfig = (block: string, testConditions: string[] | undefined): string => {
  const conditions = conditionsLine(testConditions, '    ');

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

const swappedConfig = (imports: string[], factoryCall: string, swap: PluginSwap): string => {
  return `${imports.join('\n')}

const factoryConfig = ${factoryCall};

// Swaps the integration's \`${swap.name}\` plugin for one whose output tests can cover.
export default defineConfig(async (env) => {
  const config = await factoryConfig(env);
  const plugins = (config.plugins ?? [])
    .flat()
    .filter((plugin) => {
      return !(typeof plugin === 'object' && plugin !== null && 'name' in plugin && plugin.name === '${swap.name}');
    });
  const swapped = { ...config, plugins: [...plugins, ${swap.call}] };

  return swapped;
});
`;
};

export const emitVitestConfig = (answers: Answers, setup: string): string | null => {
  if (testRunnerOf(answers) !== 'vitest') {
    return null;
  }

  const target = targetFor(answers);
  const include = coverageInclude(answers);
  const exclude = coverageExclude(answers);

  if (target.vitePlugin !== undefined) {
    const nestedBlock = testBlock(include, exclude, setup, '    ', target);

    return mergedConfig(nestedBlock, target.testConditions);
  }

  const block = testBlock(include, exclude, setup, '  ', target);

  // Astro's `getViteConfig` is the only way to reach its Vite config when there is no `vite.config.ts` to merge.
  if (target.vitestFactory !== undefined) {
    const {
      imports,
      call,
      swap,
    } = target.vitestFactory;
    const factoryCall = `${call}({
${conditionsLine(target.testConditions, '  ')}${block}
})`;

    return swap === undefined
      ? `${imports.join('\n')}

export default ${factoryCall};
`
      : swappedConfig(imports, factoryCall, swap);
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
