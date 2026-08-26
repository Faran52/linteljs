import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { env } from 'node:process';

import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest';

import { parsePackageJson } from '../../artifacts/package-json/emitPackageJson';
import {
  type Answers,
  DEFAULT_ANSWERS,
  LIBRARIES,
  TARGET_IDS,
} from '../../model/answers/answers';
import {
  CONFIG_PATH,
  emitLintelConfig,
  parseLintelConfig,
} from '../../model/config/lintelConfig';
import { targetFor } from '../../model/targets';

import { scaffoldCommand } from './pipeline';

interface RunResult {
  status: number;
  output: string;
}

// Installed from packed tarballs, not the workspace: a workspace install dedupes plugin instances, hiding the `Cannot
// redefine plugin` collision a real consumer would hit.
const TARBALL_DIR = env['LINTEL_TARBALLS'] ?? resolve(import.meta.dirname, '../../../../../.e2e');

/**
 * Exactly one tarball per package. Two versions means the directory was filled in by hand and picking the first would
 * test the wrong one silently; none means the pack step did not produce what it is named for. Both throw, and neither
 * skips: `test:e2e` runs `e2e:pack` immediately before this suite, so there is no state in which having no tarball is
 * the expected one. A suite that skipped instead reported a green run having installed nothing.
 */
const tarballFor = (prefix: string): string => {
  const matches = (existsSync(TARBALL_DIR) ? readdirSync(TARBALL_DIR) : []).filter((file) => {
    return file.startsWith(`${prefix}-`) && file.endsWith('.tgz');
  });

  if (matches.length > 1) {
    throw new Error(
      `${TARBALL_DIR} holds ${String(matches.length)} tarballs for ${prefix}: ${matches.join(', ')}. `
      + 'Run `pnpm -w run e2e:pack` to repack from a clean directory.',
    );
  }

  const [match] = matches;

  if (match === undefined) {
    throw new Error(
      `${TARBALL_DIR} holds no tarball for ${prefix}. `
      + 'Run `pnpm --filter @linteljs/create test:e2e`, which packs all three first.',
    );
  }

  return join(TARBALL_DIR, match);
};

// pnpm pack flattens the scope into the filename, so `@linteljs/eslint-config` packs as
// `linteljs-eslint-config-<version>`.
const configTarball = tarballFor('linteljs-eslint-config');
const pluginTarball = tarballFor('linteljs-eslint-plugin');
const cliTarball = tarballFor('linteljs-create');

const run = (command: string, args: string[], cwd: string, input = ''): RunResult => {
  const result = spawnSync(command, args, {
    cwd,
    input,
    encoding: 'utf8',
    // Generated projects install from the public registry; a host config pinning a private one should not be inherited
    // silently.
    env: {
      ...env,
      npm_config_registry: 'https://registry.npmjs.org/',
    },
  });

  return {
    status: result.status ?? 1,
    output: `${result.stdout}${result.stderr}`,
  };
};

// Folds the exit status into the asserted value so a failure prints the process output in the diff, rather than a bare
// `1 !== 0`.
const outcome = (result: RunResult, label: string): string => {
  return result.status === 0 ? `${label}: ok` : `${label}: exit ${String(result.status)}\n${result.output}`;
};

/**
 * The one failure worth retrying, and only this one. A scaffolder pins the version it just saw, so a run that starts
 * in the minutes around an upstream release asks the registry for something it has not finished publishing:
 * `create astro` wrote `astro: ^7.2.2` and the install died 33 seconds before that version existed, failing a release
 * that had nothing wrong with it.
 *
 * Matched on the error code rather than on any install failure, because every other one means the generated project
 * is genuinely broken, which is the whole point of this suite.
 */
const UNPUBLISHED_YET = 'ERR_PNPM_NO_MATCHING_VERSION';

const runInstallingCli = (project: string): RunResult => {
  const attempt = (): RunResult => {
    return run('node', [join(cliRoot, 'package/bin/create-linteljs.js'), '--skip-scaffold'], project);
  };

  const first = attempt();

  return first.status === 0 || !first.output.includes(UNPUBLISHED_YET) ? first : attempt();
};

const workspace = mkdtempSync(join(tmpdir(), 'lintel-e2e-'));

// The CLI runs from the packed tarball, so `bin/`, `dist/` and `assets/` are all exercised.
const cliRoot = join(workspace, 'cli');

mkdirSync(cliRoot, { recursive: true });
run('tar', ['-xzf', cliTarball, '-C', cliRoot], workspace);

/**
 * A tarball is not an installation: `npx` fetches the runtime dependencies too, and without them the packed binary
 * dies on ERR_MODULE_NOT_FOUND before writing a file. Production only, since nothing here runs the package's tests,
 * and `--prefer-offline` so the cache serves it rather than the registry on every run.
 */
run(
  'npm',
  ['install', '--omit=dev', '--prefer-offline', '--no-audit', '--no-fund'],
  join(cliRoot, 'package'),
);

afterAll(() => {
  rmSync(workspace, {
    recursive: true,
    force: true,
  });
});

// One case per target on the defaults, plus one per answer dimension the defaults never reach (libraries, no testing,
// the relaxed floor); one per dimension rather than every combination, since each case is a real install.
const CASES: { label: string;
  answers: Answers; }[] = [
  ...TARGET_IDS.map((target) => {
    return {
      label: target,
      answers: {
        ...DEFAULT_ANSWERS,
        target,
      },
    };
  }),
  {
    label: 'next with every library',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'next',
      libraries: LIBRARIES,
    },
  },
  {
    // `store: true` rides along so the one store path with a runtime install is proven end to end.
    label: 'react with every library',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'react',
      libraries: LIBRARIES,
      store: true,
    },
  },
  {
    label: 'webextension with no tests',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      testing: 'none',
    },
  },
  {
    label: 'react on the relaxed floor',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'react',
      typeSafety: 'relaxed',
    },
  },
  /**
   * The two axes, one case each, on the combination that exercises the most: Solid, because it is the framework whose
   * parts differ most from the host's (a resolve condition for the test run, a jsx import source, its own reactivity
   * rule), and Firefox, because it is the browser that changes the manifest shape and adds a runner.
   */
  {
    label: 'astro hosting solid',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'astro',
      hostedFramework: 'solid',
    },
  },
  /**
   * Hosted Vue, which no case reached before: it was the one hosted framework whose Vite plugin had no `VERSIONS`
   * entry, so both hosting targets died before writing a file. A unit test now covers the table; this covers the
   * install.
   */
  {
    label: 'astro hosting vue',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'astro',
      hostedFramework: 'vue',
    },
  },
  /**
   * A devtools-panel extension on Firefox hosting Solid, which is `compatlens`'s shape and the reason the surfaces
   * axis exists. This is the case that proves crx builds a `devtools_page` from the manifest and the panel from the
   * Rollup input beside it, neither being a page the popup-and-background default ever produced.
   */
  {
    label: 'webextension devtools panel on firefox hosting solid',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
      surfaces: ['devtools-panel'],
    },
  },
  {
    label: 'webextension on firefox hosting solid',
    answers: {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
    },
  },
];

describe('end-to-end generation', () => {
  it.each(CASES)('generates, installs and checks $label', ({ label, answers }) => {
    const root = join(workspace, label.replaceAll(' ', '-'));
    // The target id doubles as the project name, except `react-native`: `create-expo-app` rejects a name matching one
    // of its own dependencies, so this is a legal name choice, not a workaround.
    const name = answers.target === 'react-native' ? 'rn-app' : answers.target;
    const project = join(root, name);

    mkdirSync(root, { recursive: true });

    // The product's own invocation, not a copy: this line and stage 1 build the same argv from the same
    // `scaffoldCommand` function.
    const [command, ...argv] = scaffoldCommand(
      answers.packageManager,
      targetFor(answers).scaffold(name, answers),
    );

    const scaffold = run(command, argv, root);

    expect(existsSync(join(project, 'package.json')) ? 'scaffolded' : scaffold.output).toBe('scaffolded');

    // `create-linteljs` asks nothing over a real terminal here, and cannot be piped one: a non-interactive run either
    // takes `--yes` or, like this, already has a `lintel.config.json` to plan from, the same route `--skip-scaffold`
    // takes on a second run of any project. Writing the file directly is the honest equivalent of a person having
    // already answered the questionnaire once, without scripting keypresses over a pty this suite does not have.
    writeFileSync(join(project, CONFIG_PATH), emitLintelConfig(answers), 'utf8');

    // `--fresh`: this directory is new scaffolder output the CLI didn't create, and without it starter fixes stay off.
    // `--no-install` so the tarball overrides land before install; the second invocation exercises install and fix.
    const generate = run(
      'node',
      [join(cliRoot, 'package/bin/create-linteljs.js'), '--skip-scaffold', '--fresh', '--no-install'],
      project,
    );

    expect(outcome(generate, '@linteljs/create')).toBe('@linteljs/create: ok');
    expect(existsSync(join(project, 'eslint.config.js'))).toBe(true);
    expect(existsSync(join(project, CONFIG_PATH))).toBe(true);
    expect(parseLintelConfig(readFileSync(join(project, CONFIG_PATH), 'utf8')))
      .toMatchObject(answers);
    expect(parsePackageJson(readFileSync(join(project, 'package.json'), 'utf8')))
      .not.toHaveProperty('lintel');

    // pnpm 11 no longer reads the `pnpm` field in `package.json`, so overrides live here; the release-age reset is for
    // hosts with `minimumReleaseAge` set, unrelated to lintel.
    appendFileSync(
      join(project, 'pnpm-workspace.yaml'),
      [
        'overrides:',
        `  '@linteljs/eslint-config': file:${configTarball}`,
        `  '@linteljs/eslint-plugin': file:${pluginTarball}`,
        'minimumReleaseAge: 0',
        '',
      ].join('\n'),
    );

    // Stages 2-6, including install and the eslint --fix pass; `pnpm-workspace.yaml` is written once and never
    // overwritten, so the overrides appended above survive.
    const complete = runInstallingCli(project);

    expect(outcome(complete, '@linteljs/create install+fix')).toBe('@linteljs/create install+fix: ok');
    expect(complete.output).not.toContain('next: ');

    // Proves the override took rather than assuming it; a silently-ignored override would leave every assertion below
    // measuring a published package instead of this workspace.
    const why = run('pnpm', ['why', '@linteljs/eslint-plugin'], project);

    expect(why.output).toContain('@linteljs/eslint-plugin');
    expect(why.output).toContain('@linteljs/eslint-config');

    // ESLint exits 2 on a configuration failure (bad plugin, missing peer, broken parser) and 1 when it ran and found
    // problems; the two look alike in a diff but mean opposite things, so both are asserted separately.
    const lint = run('pnpm', ['lint'], project);

    expect(lint.status < 2 ? 'eslint ran' : `eslint config error\n${lint.output}`).toBe('eslint ran');

    // Zero, with no per-target allowance: an exception here is a finding the pipeline failed to repair, and its honest
    // home is a README line, not a constant that hides it.
    const found = Number(/✖ (\d+) problem/.exec(lint.output)?.[1] ?? '0');

    expect(`${String(found)} findings\n${found === 0 ? '' : lint.output}`).toBe('0 findings\n');

    // Runs `check` rather than its five commands separately, so the gate has one definition instead of a second one
    // drifting inside the test.
    expect(outcome(run('pnpm', ['check'], project), 'check')).toBe('check: ok');
  }, 900_000);
});
