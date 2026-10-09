import { RUN_PREFIX } from '@config/constants';

import { hasTests, localesOf } from '@utils/answerUtils';

import { targetFor } from '@targets';

import {
  GATE_SCRIPTS,
  STYLE_GLOB,
  TEST_RUNNERS,
} from '../../constants';
import { testRunnerOf } from '../../utils/runnerUtils';

import type { Answers, PackageManager } from '@config/types';

// Named in the return type so callers need no unreachable `?? ''`.
interface CheckScript {
  check: string;
}

// Yarn 2+ never runs `prepare`, only `postinstall`: measured on SvelteKit, whose `svelte-kit sync` never ran.
export const installScriptOf = (packageManager: PackageManager, steps: readonly string[]): Record<string, string> => {
  if (steps.length === 0) {
    return {};
  }

  const name = packageManager === 'yarn' ? 'postinstall' : 'prepare';
  const script = { [name]: steps.join(' && ') };

  return script;
};

// SFC extensions included because `src/**/*.css` matches none of a Vue project's styles.
export const styleGlob = (answers: Answers): string => {
  const { sfcExtension } = targetFor(answers);

  return sfcExtension === undefined ? STYLE_GLOB : `src/**/*.{css,${sfcExtension}}`;
};

export const lintScriptsOf = (monorepo: boolean, glob: string): Record<string, string> => {
  const scripts = {
    'lint': 'eslint . --concurrency auto',
    'lint:fix': 'eslint . --fix --concurrency auto',
    // lint-staged scans staged files only; the checker walks `src`, so an unstaged new file is scanned too.
    'lint:types': `node ${monorepo ? '../../' : ''}scripts/checkBannedPatterns.ts src`,
    // Measured: 87 findings in starter CSS passed check without it. Stylelint exits 2 on an empty glob.
    'lint:css': `stylelint "${glob}" --allow-empty-input`,
    'lint:css:fix': `stylelint "${glob}" --fix --allow-empty-input`,
  };

  return scripts;
};

export const checkScriptOf = (run: string, gates: readonly string[]): string => {
  return gates
    .map((gate) => {
      return `${run} ${gate}`;
    })
    .join(' && ');
};

// The scripts `check` chains, in order.
export const gateScripts = (answers: Answers): string[] => {
  const tested = hasTests(answers);

  return GATE_SCRIPTS
    .filter((name) => {
      return tested || name !== 'test:coverage';
    });
};

export const buildScripts = (answers: Answers): Record<string, string> & CheckScript => {
  const run = RUN_PREFIX[answers.packageManager];
  const target = targetFor(answers);
  const compiler = localesOf(answers).length === 0 ? undefined : target.i18n?.compiler;
  const compile = compiler === undefined ? [] : [compiler.command];

  const lint = lintScriptsOf(answers.layout === 'monorepo', styleGlob(answers));
  const scripts: Record<string, string> = {
    ...lint,
    typecheck: [...compile, target.typecheck].join(' && '),
  };

  Object.assign(scripts, target.extraScripts);

  const runner = testRunnerOf(answers);

  if (runner !== undefined) {
    scripts['test'] = TEST_RUNNERS[runner].test;
    scripts['test:coverage'] = TEST_RUNNERS[runner].coverage;
  }

  scripts['build'] = target.build;

  // A monorepo runs husky from the root manifest.
  const install = [
    ...compile,
    ...target.prepare === undefined ? [] : [target.prepare],
    // Not msw's own install script: a warm pnpm store replays its cached build, so the worker is never copied.
    ...answers.mocking === 'msw' && target.publicDirectory !== undefined ? ['msw init'] : [],
    ...answers.layout === 'monorepo' ? [] : ['husky'],
  ];

  const check = checkScriptOf(run, gateScripts(answers));
  const packageScripts: Record<string, string> & CheckScript = {
    ...scripts,
    check,
    ...installScriptOf(answers.packageManager, install),
  };

  return packageScripts;
};
