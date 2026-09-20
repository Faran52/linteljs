import {
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import process, { argv } from 'node:process';

import { ESLint } from 'eslint';

import { DEFAULT_ANSWERS } from '../packages/create/src/answers';
import { targetFor } from '../packages/create/src/targets';
import { defineConfig } from '../packages/eslint-config/src/defineConfig';

import type { Answers, TargetId } from '../packages/create/src/answers';
import type { StarterFile, TargetRecord } from '../packages/create/src/targets';

/**
 * The shipped starter source is the one tree nothing in `pnpm check` reads. It is not in any `tsconfig` include, the
 * root `eslint.config.ts` ignores it, and its suites are outside the vitest include, so a broken edit to any of the
 * fifty-odd files there reaches a user's project and dies in theirs.
 *
 * It cannot simply be added to this workspace's own lint: twenty-seven of its thirty-one suites test a module the
 * official scaffolder writes, and this repo deliberately ships no fork of those templates. The frameworks they import
 * are not installed here either.
 *
 * So the file is linted the way the project that receives it will lint it: `defineConfig` is the same function a
 * generated `eslint.config.js` calls, handed that target's own framework, and each file is judged at the path the
 * target record says it lands on rather than the path it is stored at. What that cannot do is type-aware rules,
 * which need a program over dependencies this workspace does not install. Dropping `typescript()` only removes
 * rules, so nothing reported here is an artefact of the omission; what is missed is missed silently, and the
 * end-to-end suite is still the only thing that runs the real gate.
 */
const STARTERS = 'packages/create/assets/target/starter-source';

const SCRIPTS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx']);

// Unresolvable by construction: the frameworks are not installed here, and `@/` and a sibling import both name
// scaffolder output. The one rule whose findings say nothing about the file.
const UNRESOLVABLE = 'import-x/no-unresolved';

/**
 * Every answer that opens a starter file, so each target's whole tree is reached rather than the default slice. More
 * than one set per target where one cannot reach everything: a browser decides which of the extension's two spellings
 * of a background script is placed, so both are asked for.
 */
const widestFor = (target: TargetId): Answers[] => {
  const widest = {
    ...DEFAULT_ANSWERS,
    target,
    surfaces: ['popup', 'background', 'devtools-panel'],
    libraries: ['tailwind', 'tanstack-query', 'zod'],
    ...(target === 'react' ? { router: 'react-router' } : {}),
  } as Answers;

  if (target !== 'webextension') {
    return [widest];
  }

  return [
    widest,
    {
      ...widest,
      browser: 'firefox',
    },
  ];
};

// `<source> -> <target>`, the records' own tables, so this reads the mapping rather than restating it.
const destinationsFor = (records: TargetRecord[]): Map<string, string> => {
  const entries: StarterFile[] = records.flatMap((record) => {
    return [...record.starterFiles ?? [], ...record.starterTests ?? []];
  });

  return new Map(entries.map((entry) => {
    return [entry.source, entry.target];
  }));
};

const filesIn = (dir: string): string[] => {
  return readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  }).filter((entry) => {
    return entry.isFile() && SCRIPTS.has(extname(entry.name));
  }).map((entry) => {
    return join(entry.parentPath, entry.name);
  });
};

// `--fix` writes the fixed text back to the asset, so the shipped bytes are already what the fix stage would make
// them. A generated project skipping that stage then gets the same file as one that runs it.
const fixing = argv.includes('--fix');

const targets = readdirSync(STARTERS, { withFileTypes: true }).filter((entry) => {
  return entry.isDirectory();
}).map((entry) => {
  return entry.name as TargetId;
});

let findings = 0;
let fixable = 0;
let checked = 0;
const unplaced: string[] = [];

for (const target of targets) {
  const records = widestFor(target).map(targetFor);
  const [record] = records;
  const destinations = destinationsFor(records);
  const config = await defineConfig({
    framework: record?.framework,
    vitest: true,
  });

  /**
   * The one rule that cannot run here. It resolves a `pages/` directory against the working directory, finds this
   * workspace instead of a Next project, and prints its complaint to stderr on every run. Nothing it checks is
   * reachable from a starter file: it reads `<a href>` against a route tree the scaffolder has not written yet.
   */
  config.push({
    name: '@linteljs/starters/no-page-tree',
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  });
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
    fix: fixing,
  });

  for (const path of filesIn(join(STARTERS, target))) {
    const source = path.slice('packages/create/assets/'.length);
    const destination = destinations.get(source);

    if (destination === undefined) {
      unplaced.push(source);
    }

    const [result] = await eslint.lintText(readFileSync(path, 'utf8'), {
      filePath: destination ?? join('src', path.slice(join(STARTERS, target).length + 1)),
    });

    if (fixing && result?.output !== undefined) {
      writeFileSync(path, result.output, 'utf8');
    }

    const reported = (result?.messages ?? []).filter((message) => {
      return message.ruleId !== UNRESOLVABLE;
    });

    checked += 1;

    for (const message of reported) {
      findings += 1;
      fixable += message.fix === undefined ? 0 : 1;
      console.error(`${source}:${String(message.line)} ${message.ruleId ?? 'parse error'}  ${message.message}`);
    }
  }
}

console.error(
  `${String(checked)} starter files linted through their own target's layers, `
  + `${String(findings)} findings, ${String(findings - fixable)} of them not autofixable`,
);

// A file no record places is a file no project receives. Reported rather than skipped, because the alternative is a
// starter that is linted at a guessed path and shipped to nobody.
if (unplaced.length > 0) {
  console.error(`\n${String(unplaced.length)} not named by any target record, linted under src/ as a guess:`);

  for (const path of unplaced) {
    console.error(`  ${path}`);
  }
}

process.exitCode = findings > 0 ? 1 : 0;
