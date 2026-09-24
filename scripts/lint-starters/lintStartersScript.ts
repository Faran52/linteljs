/**
 * Lints the shipped starter source the way the project receiving it will: `defineConfig` with the target's own
 * framework, each file judged at the path it lands on. Nothing in `pnpm check` reads that tree otherwise, and its
 * frameworks are not installed here, so type-aware rules stay with the end-to-end suite.
 *
 * Usage: node scripts/lint-starters/lintStartersScript.ts [--fix]
 */
import {
  globSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import process, { argv } from 'node:process';

import { ESLint } from 'eslint';

import { ANSWERS, DEFAULT_ANSWERS } from '../../packages/create/src/answers';
import { targetFor } from '../../packages/create/src/targets';
import { valuesOf } from '../../packages/create/src/utils/objectUtils';
import { defineConfig } from '../../packages/eslint-config/src/defineConfig';
import { log, logError } from '../utils/loggerUtils.ts';

import {
  destinationsFor,
  widestFor,
  writtenPaths,
} from './utils/answersUtils.ts';
import { unresolvedNames } from './utils/programUtils.ts';

import type { Linter } from 'eslint';

const TEMPLATES = 'packages/create/templates';
const STARTERS = `${TEMPLATES}/starter-source`;
const SCRIPT_GLOB = '**/*.{ts,tsx,mts,cts,js,jsx}';
// Astro and the two SFC formats parse without their surroundings, so the markup is judged too.
const LINTED_GLOB = '**/*.{ts,tsx,mts,cts,js,jsx,astro,vue,svelte}';

// The frameworks are not installed and `@/` names scaffolder output, so this rule's findings say nothing.
const UNRESOLVABLE = 'import-x/no-unresolved';

// `shared/` has no framework; each target places its files.
const SHARED_ROOT = 'shared';

const fixing = argv.includes('--fix');
const targets = valuesOf(ANSWERS.target.values);

const unknown = readdirSync(STARTERS).filter((name) => {
  return name !== SHARED_ROOT && !targets.some((target) => {
    return target === name;
  });
});

if (unknown.length > 0) {
  logError(`Not a target, so never linted: ${unknown.join(', ')}`);
  process.exit(1);
}

const answerSets = new Map(targets.map((target) => {
  return [target, widestFor(target)];
}));

const placement = {
  placed: new Map([...answerSets.values()].flatMap((every) => {
    return [...destinationsFor(every)];
  })),
  covered: new Map([...answerSets].map(([target, every]) => {
    return [target, writtenPaths(every)];
  })),
};

const filesOf = (target: string, pattern: string): string[] => {
  return globSync(pattern, { cwd: join(STARTERS, target) }).map((path) => {
    return join(STARTERS, target, path);
  });
};

// Two rules cannot run on text at a path nothing on disk holds.
const STARTER_OVERRIDES: Linter.Config[] = [
  // Resolves `pages/` against the working directory and finds this workspace instead of a Next project.
  {
    name: '@linteljs/starters/no-page-tree',
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
  // `projectService` needs a real tsconfig. `no-redundant-optional` reads the program's `exactOptionalPropertyTypes`
  // to decide whether to run, so without one it would report what the receiving project never does.
  {
    name: '@linteljs/starters/no-program',
    languageOptions: { parserOptions: { projectService: false } },
    rules: { 'sonarjs/no-redundant-optional': 'off' },
  },
];

const eslintFor = async (target: (typeof targets)[number]): Promise<ESLint> => {
  const record = targetFor(answerSets.get(target)?.[0] ?? DEFAULT_ANSWERS);
  const config = await defineConfig({
    framework: record.framework,
    astro: record.astro === true,
    vitest: true,
  });

  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [...config, ...STARTER_OVERRIDES],
    fix: fixing,
  });
};

const lintTarget = async (target: string, eslint: ESLint): Promise<[string[], number, number, string[]]> => {
  const findings: string[] = [];
  const unplaced: string[] = [];
  let fixable = 0;
  const files = filesOf(target, LINTED_GLOB);

  for (const path of files) {
    const source = relative(TEMPLATES, path);
    const destination = placement.placed.get(source);

    if (destination === undefined) {
      unplaced.push(source);
    }

    const [result] = await eslint.lintText(readFileSync(path, 'utf8'), {
      filePath: destination ?? join('src', relative(join(STARTERS, target), path)),
    });

    // Written back, so the shipped bytes are already what the fix stage would make them.
    if (fixing && result?.output !== undefined) {
      writeFileSync(path, result.output, 'utf8');
    }

    for (const message of result?.messages ?? []) {
      if (message.ruleId !== UNRESOLVABLE) {
        fixable += message.fix === undefined ? 0 : 1;
        findings.push(`${source}:${String(message.line)} ${message.ruleId ?? 'parse error'}  ${message.message}`);
      }
    }
  }

  return [findings, fixable, files.length, unplaced];
};

// Built in turn: `defineConfig` loads its layers lazily, and two loads racing each other read a half-built module.
const linters: [string, ESLint][] = [];

for (const target of targets) {
  linters.push([target, await eslintFor(target)]);
}

const results = await Promise.all(linters.map(async ([target, eslint]) => {
  return await lintTarget(target, eslint);
}));
const findings = results.flatMap(([found]) => {
  return found;
});
const unplaced = results.flatMap(([, , , missing]) => {
  return missing;
});
const fixable = results.reduce((total, [, count]) => {
  return total + count;
}, 0);
const checked = results.reduce((total, [, , count]) => {
  return total + count;
}, 0);

const unresolved = unresolvedNames(STARTERS, targets.flatMap((target) => {
  return filesOf(target, SCRIPT_GLOB);
}), placement);

for (const finding of [...findings, ...unresolved]) {
  logError(finding);
}

log(`${String(checked)} starter files linted through their own target's layers, ${String(findings.length)} findings, `
  + `${String(findings.length - fixable)} of them not autofixable, ${String(unresolved.length)} names neither imported `
  + 'nor global');

// A file no record places reaches no project, so it is reported rather than linted at a guessed path in silence.
if (unplaced.length > 0) {
  logError(`${String(unplaced.length)} not named by any target record, linted under src/ as a guess:\n  `
    + unplaced.join('\n  '));
}

process.exitCode = findings.length > 0 || unresolved.length > 0 ? 1 : 0;
