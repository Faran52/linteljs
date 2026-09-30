// Nothing in `pnpm check` reads the starter tree otherwise; type-aware rules stay with the e2e suite.
import {
  globSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import process, { argv } from 'node:process';

import { ESLint, type Linter } from 'eslint';

import { ANSWERS, DEFAULT_ANSWERS } from '../../packages/create/src/answers';
import { targetFor } from '../../packages/create/src/targets';
import { valuesOf } from '../../packages/create/src/utils/objectUtils';
import { log, logError } from '../../packages/create/templates/project/scripts/utils/loggerUtils.ts';
import { composeConfig } from '../../packages/eslint-config/src/compose-config/composeConfig';

import {
  destinationsFor,
  setupsFor,
  widestFor,
  writtenPaths,
} from './utils/answersUtils.ts';
import { unresolvedNames } from './utils/programUtils.ts';

import type { TargetId } from '../../packages/create/src/config/types';

interface Linters {
  starters: ESLint;
  // Always fixing: the project's own fix stage rewrites the joined setup at birth, so only what survives it counts.
  setups: ESLint;
}

interface SetupLint {
  findings: string[];
  count: number;
}

const TEMPLATES = 'packages/create/templates';
const STARTERS = `${TEMPLATES}/starter-source`;
const SCRIPT_GLOB = '**/*.{ts,tsx,mts,cts,js,jsx}';
const LINTED_GLOB = '**/*.{ts,tsx,mts,cts,js,jsx,astro,vue,svelte}';

// The frameworks are not installed and `@/` names scaffolder output.
const UNRESOLVABLE = 'import-x/no-unresolved';

const SHARED_ROOT = 'shared';

const fixing = argv.includes('--fix');
const targets = valuesOf(ANSWERS.target.values);

const unknown = readdirSync(STARTERS)
  .filter((name) => {
    return name !== SHARED_ROOT && !targets
      .some((target) => {
        return target === name;
      });
  });

if (unknown.length > 0) {
  logError(`Not a target, so never linted: ${unknown.join(', ')}`);
  process.exit(1);
}

const answerSets = new Map(targets
  .map((target) => {
    return [target, widestFor(target)];
  }));

const placement = {
  placed: new Map([...answerSets.values()]
    .flatMap((every) => {
      return [...destinationsFor(every)];
    })),
  covered: new Map([...answerSets]
    .map(([target, every]) => {
      return [target, writtenPaths(every)];
    })),
};

const filesOf = (target: string, pattern: string): string[] => {
  return globSync(pattern, { cwd: join(STARTERS, target) })
    .map((path) => {
      return join(STARTERS, target, path);
    });
};

// Two rules cannot run on text at a path nothing on disk holds.
const STARTER_OVERRIDES: Linter.Config[] = [
  // Resolves `pages/` against the working directory and finds this workspace instead.
  {
    name: '@linteljs/starters/no-page-tree',
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
  // `no-redundant-optional` reads the program's `exactOptionalPropertyTypes`, which needs a real tsconfig.
  {
    name: '@linteljs/starters/no-program',
    languageOptions: { parserOptions: { projectService: false } },
    rules: { 'sonarjs/no-redundant-optional': 'off' },
  },
  // Off until the reformat commit lands. docs/DESIGN.md: `@linteljs/workspace/pending-list-reformat`
  {
    name: '@linteljs/starters/pending-list-reformat',
    rules: { '@linteljs/array-newline': 'off' },
  },
];

const eslintFor = async (target: TargetId): Promise<Linters> => {
  const record = targetFor(answerSets.get(target)?.[0] ?? DEFAULT_ANSWERS);
  // The record's own naming, or a suite named against it passes here and fails the generated project.
  const config = await composeConfig({
    framework: record.framework,
    astro: record.astro === true,
    vitest: true,
    libraries: ['stylex'],
    naming: record.naming,
    folderNaming: record.folderNaming,
  });

  const overrideConfig = [...config, ...STARTER_OVERRIDES];

  return {
    starters: new ESLint({
      overrideConfigFile: true,
      overrideConfig,
      fix: fixing,
    }),
    setups: new ESLint({
      overrideConfigFile: true,
      overrideConfig,
      fix: true,
    }),
  };
};

const lintSetups = async (target: TargetId, eslint: ESLint): Promise<SetupLint> => {
  const findings: string[] = [];
  const setups = [...setupsFor(answerSets.get(target) ?? []).values()];

  for (const [destination, sources] of setups) {
    const text = sources
      .map((source) => {
        return readFileSync(join(TEMPLATES, source), 'utf8');
      })
      .join('\n');
    const [result] = await eslint.lintText(text, { filePath: destination });

    for (const message of result?.messages ?? []) {
      if (message.ruleId !== UNRESOLVABLE) {
        findings.push(`${sources.join(' + ')} as ${destination}:${String(message.line)} `
          + `${message.ruleId ?? 'parse error'}  ${message.message}`);
      }
    }
  }

  return {
    findings,
    count: setups.length,
  };
};

const lintTarget = async (target: TargetId, eslint: Linters): Promise<[string[], number, number, string[]]> => {
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

    const [result] = await eslint.starters.lintText(readFileSync(path, 'utf8'), {
      filePath: destination ?? join('src', relative(join(STARTERS, target), path)),
    });

    // Written back, so the shipped bytes are what the fix stage would make them.
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

  const setups = await lintSetups(target, eslint.setups);

  return [[...findings, ...setups.findings], fixable, files.length + setups.count, unplaced];
};

// In turn: two lazy `composeConfig` loads racing read a half-built module.
const linters: [TargetId, Linters][] = [];

for (const target of targets) {
  linters.push([target, await eslintFor(target)]);
}

const lints = linters
  .map(async ([target, eslint]) => {
    return await lintTarget(target, eslint);
  });

const results = await Promise.all(lints);
const findings = results
  .flatMap(([found]) => {
    return found;
  });
const unplaced = results
  .flatMap(([, , , missing]) => {
    return missing;
  });
const fixable = results
  .reduce((total, [, count]) => {
    return total + count;
  }, 0);
const checked = results
  .reduce((total, [, , count]) => {
    return total + count;
  }, 0);

const scripts = targets
  .flatMap((target) => {
    return filesOf(target, SCRIPT_GLOB);
  });

const unresolved = unresolvedNames(STARTERS, scripts, placement);

for (const finding of [...findings, ...unresolved]) {
  logError(finding);
}

log(`${String(checked)} starter files linted through their own target's layers, ${String(findings.length)} findings, `
  + `${String(findings.length - fixable)} of them not autofixable, ${String(unresolved.length)} names neither imported `
  + 'nor global');

// A file no record places reaches no project.
if (unplaced.length > 0) {
  logError(`${String(unplaced.length)} not named by any target record, linted under src/ as a guess:\n  `
    + unplaced.join('\n  '));
}

process.exitCode = findings.length > 0 || unresolved.length > 0 || unplaced.length > 0 ? 1 : 0;
