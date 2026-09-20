import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import process, { argv } from 'node:process';

import { ESLint } from 'eslint';
import ts from 'typescript';

import { DEFAULT_ANSWERS } from '../packages/create/src/answers';
import { starterSourceEmitter } from '../packages/create/src/emitters/target/starter-source/starterSourceEmitter';
import { targetFor } from '../packages/create/src/targets';
import { defineConfig } from '../packages/eslint-config/src/defineConfig';

import type { Answers, TargetId } from '../packages/create/src/answers';

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

/**
 * What a generated project gives a starter that the starter does not import. Read off disk and handed to the program
 * under a virtual path: as a real `.d.ts` it was picked up by typescript-eslint's project service for files outside
 * every tsconfig and broke their resolution, so it exists nowhere any other tool can find it.
 */
const GLOBALS = 'scripts/starters/globals.dts';

const VIRTUAL_GLOBALS = 'starterGlobals.d.ts';

/**
 * The one question a program answers and ESLint cannot: is every name either imported or a global the destination
 * has? `no-undef` would be the cheaper lever and is the wrong one, because typescript-eslint turns it off on the
 * grounds that `tsc` does this job, and for this tree no `tsc` ever runs.
 *
 * Only these codes. `globals.d.ts` declares every import `any`, since the dependencies are not installed, so every
 * other diagnostic is an artefact of that rather than a fact about the file. This is what caught
 * `children?: React.ReactNode` against no React import, which shipped for as long as it took to look.
 */
const UNRESOLVED_NAME = new Set([
  2304, // Cannot find name
  2503, // Cannot find namespace
  2552, // Cannot find name, did you mean
  2686, // refers to a UMD global, but the current file is a module
]);

const unresolvedNames = (files: string[]): string[] => {
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
  };

  const host = ts.createCompilerHost(options, true);
  const readDirectly = host.getSourceFile.bind(host);
  const globals = readFileSync(GLOBALS, 'utf8');

  host.fileExists = (path) => {
    return path === VIRTUAL_GLOBALS || existsSync(path);
  };

  host.getSourceFile = (path, language, onError, shouldCreate) => {
    return path === VIRTUAL_GLOBALS
      ? ts.createSourceFile(path, globals, language, true, ts.ScriptKind.TS)
      : readDirectly(path, language, onError, shouldCreate);
  };

  const program = ts.createProgram([...files, VIRTUAL_GLOBALS], options, host);

  return ts.getPreEmitDiagnostics(program).filter((diagnostic) => {
    return UNRESOLVED_NAME.has(diagnostic.code) && diagnostic.file !== undefined;
  }).map((diagnostic) => {
    const file = diagnostic.file?.fileName ?? '';
    const line = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line ?? 0;
    const where = `${file.split('assets/')[1] ?? file}:${String(line + 1)}`;

    return `${where} TS${String(diagnostic.code)}  ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`;
  });
};

const SCRIPTS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx']);

// Unresolvable by construction: the frameworks are not installed here, and `@/` and a sibling import both name
// scaffolder output. The one rule whose findings say nothing about the file.
const UNRESOLVABLE = 'import-x/no-unresolved';

/**
 * Every answer that opens a starter file, so each target's whole tree is reached rather than the default slice. More
 * than one set per target where one cannot reach everything: a browser picks one of the extension's two spellings of
 * a background script and a router one of react's two entries, so each is asked for in turn.
 */
const widestFor = (target: TargetId): Answers[] => {
  const widest: Answers = {
    ...DEFAULT_ANSWERS,
    target,
    surfaces: ['popup', 'background', 'devtools-panel'],
    libraries: ['tailwind', 'tanstack-query', 'zod'],
  };

  return [
    widest,
    {
      ...widest,
      browser: 'firefox',
    },
    {
      ...widest,
      router: 'react-router',
    },
    {
      ...widest,
      router: 'tanstack-router',
    },
  ];
};

/**
 * `<asset> -> <destination>`, read through the emitter rather than off the record. A record names the destination
 * and `starterSourceEmitter` derives the asset from it, so this is the same derivation the pipeline runs and a
 * mirror that drifts from it shows up here as a file no answer places.
 */
const destinationsFor = (every: Answers[]): Map<string, string> => {
  const found = new Map<string, string>();

  for (const answers of every) {
    for (const artifact of starterSourceEmitter(answers)) {
      if ('sources' in artifact.content) {
        for (const source of artifact.content.sources) {
          found.set(source, artifact.target);
        }
      }
    }
  }

  return found;
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
  const every = widestFor(target);
  const record = targetFor(every[0] ?? DEFAULT_ANSWERS);
  const destinations = destinationsFor(every);
  const config = await defineConfig({
    framework: record.framework,
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

const unresolved = unresolvedNames(targets.flatMap((target) => {
  return filesIn(join(STARTERS, target));
}));

for (const message of unresolved) {
  console.error(message);
}

console.error(
  `${String(checked)} starter files linted through their own target's layers, `
  + `${String(findings)} findings, ${String(findings - fixable)} of them not autofixable, `
  + `${String(unresolved.length)} names neither imported nor global`,
);

// A file no record places is a file no project receives. Reported rather than skipped, because the alternative is a
// starter that is linted at a guessed path and shipped to nobody.
if (unplaced.length > 0) {
  console.error(`\n${String(unplaced.length)} not named by any target record, linted under src/ as a guess:`);

  for (const path of unplaced) {
    console.error(`  ${path}`);
  }
}

process.exitCode = findings > 0 || unresolved.length > 0 ? 1 : 0;
