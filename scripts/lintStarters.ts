import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  dirname,
  extname,
  join,
} from 'node:path';
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
 * The one question a program answers and ESLint cannot: does every name and every relative import resolve?
 * `no-undef` would be the cheaper lever and is the wrong one, because typescript-eslint turns it off on the grounds
 * that `tsc` does this job, and for this tree no `tsc` runs.
 *
 * A bare specifier this workspace does not install is the one thing waved through, and it is waved through by name
 * rather than by a `declare module '*'`. That wildcard matches every specifier that fails to resolve, so a
 * misspelled relative import inside the starter tree passed silently, which is the defect this is most for.
 */
const UNRESOLVED = new Set([
  2304, // Cannot find name
  2307, // Cannot find module, kept for a relative specifier and discarded for a bare one
  2339, // Property does not exist on type
  2503, // Cannot find namespace
  2552, // Cannot find name, did you mean
  2593, // Cannot find name, do you need the test runner's types
  2686, // refers to a UMD global, but the current file is a module
  2694, // Namespace has no exported member
]);

/**
 * Which ambient packages a program gets, which is what a generated project's own `tsconfig` decides. The two
 * extension type packages are mutually exclusive, so the tree is checked as three programs rather than one: the
 * browser each half is written for, and everything else.
 */
const SCOPES: [string, string[]][] = [
  [`${STARTERS}/webextension/chrome`, ['chrome']],
  [`${STARTERS}/webextension/firefox`, ['firefox-webext-browser']],
  ['', ['react']],
];

const scopeOf = (file: string): string => {
  return SCOPES.find(([prefix]) => {
    return prefix !== '' && file.startsWith(prefix);
  })?.[0] ?? '';
};

// The text at the diagnostic, which for an unresolved module is the specifier with its quotes.
const specifierAt = (diagnostic: ts.Diagnostic): string => {
  return diagnostic.file?.text.slice(diagnostic.start ?? 0, (diagnostic.start ?? 0) + (diagnostic.length ?? 0)) ?? '';
};

/**
 * A starter referencing scaffolder output the record has no word for. `covers` names the one module a starter test
 * is about; these three reach a second one, so they are listed rather than inferred. A fourth has to be added on
 * purpose, which is the point: the alternative was a `declare module '*'` that swallowed every typo in the tree.
 */
const SCAFFOLDER_WRITES = new Set([
  // `create-vite` writes `src/App.tsx`; both routers import it into the route they add.
  'target/starter-source/react/react-router/src/routes/router.tsx:../App',
  'target/starter-source/react/tanstack-router/src/routes/index.tsx:../App',
  // `create-vue` writes `src/router/index.ts`; the App suite mounts through it, and covers `src/App.vue`.
  'target/starter-source/vue/src/App.test.ts:./router',
]);

const withoutExtension = (path: string): string => {
  return path.replace(/\.[cm]?[jt]sx?$/, '');
};

/**
 * A bare specifier names a package this workspace does not install and says nothing about the file. A relative one
 * names a path, and the only path allowed not to exist is the module the starter test covers, which the official
 * scaffolder writes. `requires` on the artifact is the record's own word for that, so a typo in any other relative
 * import is a finding rather than something a `declare module '*'` swallows.
 */
const resolvesElsewhere = (diagnostic: ts.Diagnostic): boolean => {
  const specifier = specifierAt(diagnostic).slice(1, -1);

  if (!specifier.startsWith('.')) {
    return true;
  }

  const asset = (diagnostic.file?.fileName ?? '').split('assets/')[1] ?? '';

  if (SCAFFOLDER_WRITES.has(`${asset}:${specifier}`)) {
    return true;
  }

  const destination = placed.get(asset);
  const requires = covered.get(asset);

  if (destination === undefined || requires === undefined) {
    return false;
  }

  return withoutExtension(join(dirname(destination), specifier)) === withoutExtension(requires);
};

const reportable = (diagnostic: ts.Diagnostic): boolean => {
  if (!UNRESOLVED.has(diagnostic.code) || diagnostic.file === undefined) {
    return false;
  }

  return diagnostic.code !== 2307 || !resolvesElsewhere(diagnostic);
};

const diagnose = (files: string[], types: string[]): string[] => {
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types,
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

  return ts.getPreEmitDiagnostics(program).filter(reportable).map((diagnostic) => {
    const file = diagnostic.file?.fileName ?? '';
    const line = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line ?? 0;
    const where = `${file.split('assets/')[1] ?? file}:${String(line + 1)}`;

    return `${where} TS${String(diagnostic.code)}  ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`;
  });
};

const unresolvedNames = (files: string[]): string[] => {
  return SCOPES.flatMap(([prefix, types]) => {
    const own = files.filter((file) => {
      return scopeOf(file) === prefix;
    });

    return own.length === 0 ? [] : diagnose(own, types);
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

/**
 * The module a starter test covers, which the official scaffolder writes and this repo deliberately does not own.
 * Keyed by the asset doing the importing, so an unresolved relative import is waved through for exactly the one path
 * the record says is not ours, and is a finding for every other. `requires` on the artifact is that path.
 */
const scaffolded = (every: Answers[]): Map<string, string> => {
  const found = new Map<string, string>();

  for (const answers of every) {
    for (const artifact of starterSourceEmitter(answers)) {
      if ('sources' in artifact.content && artifact.requires !== undefined) {
        for (const source of artifact.content.sources) {
          found.set(source, artifact.requires);
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

// `<asset> -> <destination>` and `<asset> -> <the module the scaffolder writes>`, over every target at once.
const placed = new Map<string, string>();
const covered = new Map<string, string>();

for (const target of targets) {
  for (const [source, destination] of destinationsFor(widestFor(target))) {
    placed.set(source, destination);
  }

  for (const [source, requires] of scaffolded(widestFor(target))) {
    covered.set(source, requires);
  }
}

for (const target of targets) {
  const every = widestFor(target);
  const record = targetFor(every[0] ?? DEFAULT_ANSWERS);
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
  /**
   * Reaching React's types through the global namespace rather than importing them. Legal TypeScript, because
   * `@types/react` declares `React` globally for JSX, so no program refuses it: `children?: React.ReactNode` shipped
   * against no React import and every type check available here passed it. A rule, because it is a style the
   * standard holds and not an error the compiler has.
   */
  config.push({
    name: '@linteljs/starters/react-by-import',
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "TSQualifiedName[left.name='React'], MemberExpression[object.name='React']",
        message: "Import React's types rather than reaching them through the global namespace.",
      }],
    },
  });

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
    fix: fixing,
  });

  for (const path of filesIn(join(STARTERS, target))) {
    const source = path.slice('packages/create/assets/'.length);
    const destination = placed.get(source);

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
