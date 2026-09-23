import {
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

import {
  ANSWERS,
  DEFAULT_ANSWERS,
  onlyFor,
} from '../packages/create/src/answers';
import { starterSourceEmitter } from '../packages/create/src/emitters/target/starter-source/starterSourceEmitter';
import { targetFor } from '../packages/create/src/targets';
import { valuesOf } from '../packages/create/src/utils/objectUtils';
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
const STARTERS = 'packages/create/templates/starter-source';

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
 * Which ambient packages a program gets, which is what a generated project's own `tsconfig` decides. Every one is
 * the real package, installed as gate machinery, so nothing about a global is declared by hand here: `vitest/globals`
 * is what `globals: true` gives a project, and the two extension packages are what its `types` names.
 *
 * Three programs rather than one because `@types/chrome` and `@types/firefox-webext-browser` are mutually exclusive,
 * which is the same reason a project only ever installs one of them.
 */
const SCOPES: [string, string[]][] = [
  [`${STARTERS}/webextension/chrome`, ['chrome', 'vitest/globals']],
  [`${STARTERS}/webextension/firefox`, ['firefox-webext-browser', 'vitest/globals']],
  ['', ['react', 'vitest/globals']],
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

  const asset = (diagnostic.file?.fileName ?? '').split('templates/')[1] ?? '';

  const destination = placed.get(asset);
  const target = asset.split('/')[1] ?? '';

  if (destination === undefined) {
    return false;
  }

  const wanted = withoutExtension(join(dirname(destination), specifier));

  // A specifier naming a directory resolves to its `index`, which is how vue's suite reaches `src/router/`.
  return [...covered.get(target) ?? []].some((path) => {
    const declared = withoutExtension(path);

    return declared === wanted || declared === join(wanted, 'index');
  });
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

  const program = ts.createProgram(files, options);

  return ts.getPreEmitDiagnostics(program).filter(reportable).map((diagnostic) => {
    const file = diagnostic.file?.fileName ?? '';
    const line = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line ?? 0;
    const where = `${file.split('templates/')[1] ?? file}:${String(line + 1)}`;

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

/*
 * What ESLint can read here beyond a script: Astro's template and the two single file component formats. Each of
 * the three parsers reads the file and nothing of its surroundings, so the markup is judged by the same rules a
 * project judges it by.
 *
 * `.vue` and `.svelte` cost one thing the other extensions do not, and `no-program` below is what pays it: their
 * layers ask for a program where every other layer here leaves it to `typescript()`.
 *
 * The program further down takes scripts alone either way: TypeScript has no parser for a component at all.
 */
const TEMPLATES = new Set(['.astro', '.vue', '.svelte']);

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
    libraries: ['zod'],
    // Its own field since v2 lifted it out of `libraries`, and it still opens a starter file.
    styling: 'tailwind',
  };
  const record = targetFor(widest);

  return [
    widest,
    {
      ...widest,
      browser: 'firefox',
    },
    /*
     * One pass per form library: each binds the same page through its own hook, and the page is shared. A pass
     * without zod too, since the rules it replaces are their own file either way.
     */
    ...valuesOf(ANSWERS.form.values)
      .filter((form) => {
        const only = onlyFor(ANSWERS.form, form);

        return only === undefined || only(record, widest);
      })
      .flatMap((form): Answers[] => {
        return [
          {
            ...widest,
            form,
          },
          {
            ...widest,
            form,
            libraries: [],
          },
        ];
      }),
    /*
     * StyleX has its own names for the tokens and its own module beside every styled component; the widest pass
     * above is the Tailwind one. A form and a store come with it because two of those four modules ship only
     * where the component they sit beside does.
     */
    {
      ...widest,
      styling: 'stylex',
      form: 'tanstack-form',
      ...(record.stores?.[0] === undefined ? {} : { store: record.stores[0] }),
    },
    /*
     * One pass per data layer, with a form so there is something to submit. RTK Query needs the Redux store it
     * ships inside, and registering it is what its own store file is for.
     */
    {
      ...widest,
      form: 'tanstack-form',
      data: 'tanstack-query',
    },
    {
      ...widest,
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    },
    // One pass per store: the markup is shared, and the module behind `useCounter` is not.
    ...(record.stores ?? []).map((store): Answers => {
      return {
        ...widest,
        store,
      };
    }),
    ...(record.routers ?? []).map((router): Answers => {
      return {
        ...widest,
        router,
      };
    }),
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
 * Every module a starter may import: every destination this target writes, each starter test's `covers`, the
 * `needs` beside it, and the record this CLI emits for the Version page to read. A set per target rather than
 * per asset, because the question a relative import asks is whether the target writes that path rather than
 * whether this one file covers it: `src/App.tsx` is what `App.test.tsx` covers and what both routers import.
 */
const writtenPaths = (every: Answers[]): Set<string> => {
  const found = new Set<string>();

  for (const answers of every) {
    found.add(targetFor(answers).recordModule);

    for (const artifact of starterSourceEmitter(answers)) {
      // Its own destination too: one starter file importing another is reaching a path the project has.
      found.add(artifact.target);

      for (const path of artifact.requires ?? []) {
        found.add(path);
      }
    }
  }

  return found;
};

const filesIn = (dir: string, extensions: Set<string>): string[] => {
  return readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  }).filter((entry) => {
    return entry.isFile() && extensions.has(extname(entry.name));
  }).map((entry) => {
    return join(entry.parentPath, entry.name);
  });
};

const LINTED = SCRIPTS.union(TEMPLATES);

// `--fix` writes the fixed text back to the asset, so the shipped bytes are already what the fix stage would make
// them. A generated project skipping that stage then gets the same file as one that runs it.
const fixing = argv.includes('--fix');

/*
 * A directory per target, and one more that is not one: `shared/` holds what has no framework in it, and every
 * target reaches its files rather than owning a copy. It is linted through whichever target places it.
 */
const SHARED_ROOT = 'shared';

const targets = readdirSync(STARTERS, { withFileTypes: true }).filter((entry) => {
  return entry.isDirectory() && entry.name !== SHARED_ROOT;
}).map((entry) => {
  return entry.name as TargetId;
});

let findings = 0;
let fixable = 0;
let checked = 0;
const unplaced: string[] = [];

// `<asset> -> <destination>` and `<asset> -> <the module the scaffolder writes>`, over every target at once.
const placed = new Map<string, string>();
const covered = new Map<string, Set<string>>();

for (const target of targets) {
  for (const [source, destination] of destinationsFor(widestFor(target))) {
    placed.set(source, destination);
  }

  covered.set(target, writtenPaths(widestFor(target)));
}

for (const target of targets) {
  const every = widestFor(target);
  const record = targetFor(every[0] ?? DEFAULT_ANSWERS);
  const config = await defineConfig({
    framework: record.framework,
    // Astro's layer is what brings its parser; without it every `.astro` file is a file with no configuration.
    astro: record.astro === true,
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
   * `projectService` resolves a file against a real `tsconfig.json`, and this walk lints text at a path nothing on
   * disk holds. `vue()` and `svelte()` set it on their own layer rather than leaving it to `typescript()`, which is
   * why those two extensions were once excluded outright; off here, they parse like any other file.
   *
   * It costs no more than the omission of `typescript()` already costs, since both drop the same half: the rules
   * that read a program. `@typescript-eslint`'s `*-type-checked` sets are not composed here to begin with, and
   * what `projectService` was still feeding is sonarjs's type-aware half, fifty-odd rules with `null-dereference`
   * and `no-ignored-return` among them. Every syntactic rule runs, and the end-to-end suite is the real gate.
   *
   * `sonarjs/no-redundant-optional` goes off with it, being the one rule that reads the program to decide whether
   * to run at all rather than what to say: it returns early under `exactOptionalPropertyTypes`, which every
   * generated `tsconfig.json` sets. With no program it cannot see the flag, so `?: T | undefined` would report
   * here and never in the project that receives the file, which is the one artefact this omission can produce.
   */
  config.push({
    name: '@linteljs/starters/no-program',
    languageOptions: { parserOptions: { projectService: false } },
    rules: { 'sonarjs/no-redundant-optional': 'off' },
  });

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: config,
    fix: fixing,
  });

  for (const path of filesIn(join(STARTERS, target), LINTED)) {
    const source = path.slice('packages/create/templates/'.length);
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
  return filesIn(join(STARTERS, target), SCRIPTS);
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
