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

import { parsePackageJson } from '../../../artifacts/package-json/emitPackageJson';
import {
  type Answers,
  DEFAULT_ANSWERS,
  type PackageManager,
} from '../../../model/answers/answers';
import {
  CONFIG_PATH,
  emitLintelConfig,
  parseLintelConfig,
} from '../../../model/config/lintelConfig';
import { targetFor } from '../../../model/targets';
import { scaffoldCommand } from '../pipeline';

export interface RunResult {
  status: number;
  output: string;
}

// Installed from packed tarballs, not the workspace: a workspace install dedupes plugin instances, hiding the `Cannot
// redefine plugin` collision a real consumer would hit.
export const TARBALL_DIR = env['LINTEL_TARBALLS'] ?? resolve(import.meta.dirname, '../../../../../.e2e');

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
export const configTarball = tarballFor('linteljs-eslint-config');
export const pluginTarball = tarballFor('linteljs-eslint-plugin');
export const cliTarball = tarballFor('linteljs-create');

export const run = (command: string, args: string[], cwd: string, input = ''): RunResult => {
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
export const outcome = (result: RunResult, label: string): string => {
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
const UNPUBLISHED_YET_BY_PM: Record<PackageManager, string[]> = {
  pnpm: ['ERR_PNPM_NO_MATCHING_VERSION'],
  npm: ['npm ERR! code E404', 'npm ERR! 404 Not Found'],
  yarn: ['YN0027'],
  bun: ['error:'],
};

const isUnpublishedYet = (pm: PackageManager, output: string): boolean => {
  return UNPUBLISHED_YET_BY_PM[pm].some((code) => {
    return output.includes(code);
  });
};

const getCmd = (pm: PackageManager): string => {
  if (pm === 'npm') {
    return 'npm';
  }
  if (pm === 'yarn') {
    return 'yarn';
  }
  if (pm === 'bun') {
    return 'bun';
  }
  return 'pnpm';
};

export const runPm = (pm: PackageManager, args: string[], project: string): RunResult => {
  const cmd = getCmd(pm);
  const mapArg = (a: string): string => {
    if (a === 'why') {
      if (pm === 'npm') {
        return 'ls';
      }
      if (pm === 'bun') {
        return 'pm ls';
      }
      return a;
    }
    if (a === 'lint' || a === 'check') {
      if (pm === 'npm') {
        return `run ${a}`;
      }
      return a;
    }
    return a;
  };
  const mapped = args.map(mapArg);
  return run(cmd, mapped, project);
};

let cliRoot: string | undefined;

const getCliRoot = (): string => {
  if (cliRoot !== undefined) {
    return cliRoot;
  }
  const root = join(mkdtempSync(join(tmpdir(), 'lintel-e2e-')), 'cli');
  mkdirSync(root, { recursive: true });
  run('tar', ['-xzf', cliTarball, '-C', root], TARBALL_DIR);
  cliRoot = root;
  return root;
};

/**
 * A tarball is not an installation: `npx` fetches the runtime dependencies too, and without them the packed binary
 * dies on ERR_MODULE_NOT_FOUND before writing a file. Production only, since nothing here runs the package's tests,
 * and `--prefer-offline` so the cache serves it rather than the registry on every run.
 */
let installed = false;

export const installCli = (): string => {
  const root = getCliRoot();
  if (!installed) {
    run(
      'npm',
      ['install', '--omit=dev', '--prefer-offline', '--no-audit', '--no-fund'],
      join(root, 'package'),
    );
    installed = true;
  }
  return root;
};

export const runInstallingCli = (project: string, pm: PackageManager): RunResult => {
  const root = installCli();
  const attempt = (): RunResult => {
    return run('node', [join(root, 'package/bin/create-linteljs.js'), '--skip-scaffold', '--fresh'], project);
  };

  const first = attempt();

  return first.status === 0 || !isUnpublishedYet(pm, first.output) ? first : attempt();
};

export const workspace = mkdtempSync(join(tmpdir(), 'lintel-e2e-'));

export const afterAllCleanup = (): void => {
  rmSync(workspace, {
    recursive: true,
    force: true,
  });
};

// Creates cases for a target across all package managers.
export const withPackageManagers = (
  label: string,
  baseAnswers: Partial<Answers>,
): { label: string;
  answers: Answers; }[] => {
  return (['pnpm', 'npm', 'yarn', 'bun'] as const).map((packageManager) => {
    return {
      label: `${label} on ${packageManager}`,
      answers: {
        ...DEFAULT_ANSWERS,
        ...baseAnswers,
        packageManager,
      },
    };
  });
};

// Creates cases for a target with default package manager (pnpm).
export const withDefaultPm = (
  label: string,
  baseAnswers: Partial<Answers>,
): { label: string;
  answers: Answers; }[] => {
  return [{
    label,
    answers: {
      ...DEFAULT_ANSWERS,
      ...baseAnswers,
    },
  }];
};

export const scaffoldProject = (
  root: string,
  name: string,
  answers: Answers,
  project: string,
): void => {
  mkdirSync(root, { recursive: true });

  // The product's own invocation, not a copy: this line and stage 1 build the same argv from the same
  // `scaffoldCommand` function.
  const spec = targetFor(answers).scaffold(name, answers);
  const [command, ...argv] = scaffoldCommand(answers.packageManager, spec);

  const scaffold = run(command, argv, root);

  expect(existsSync(join(project, 'package.json')) ? 'scaffolded' : scaffold.output).toBe('scaffolded');

  /**
   * `create-linteljs` asks nothing over a real terminal here, and cannot be piped one: a non-interactive run either
   * takes `--yes` or, like this, already has a `lintel.config.json` to plan from, the same route `--skip-scaffold`
   * takes on a second run of any project. Writing the file directly is the honest equivalent of a person having
   * already answered the questionnaire once, without scripting keypresses over a pty this suite does not have.
   */
  writeFileSync(join(project, CONFIG_PATH), emitLintelConfig(answers), 'utf8');
};

export const generateLintel = (project: string): RunResult => {
  // `--fresh`: this directory is new scaffolder output the CLI didn't create, and without it starter fixes stay off.
  // `--no-install` so the tarball overrides land before install; the second invocation exercises install and fix.
  return run(
    'node',
    [join(installCli(), 'package/bin/create-linteljs.js'), '--skip-scaffold', '--fresh', '--no-install'],
    project,
  );
};

export const applyTarballOverrides = (project: string, pm: PackageManager): void => {
  // Override the lintel packages with local tarballs so the install uses them rather than the registry.
  // pnpm uses `pnpm-workspace.yaml`; npm/yarn/bun use `package.json`.
  if (pm === 'pnpm') {
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
  }
  else {
    const pkgPath = join(project, 'package.json');
    const pkg = parsePackageJson(readFileSync(pkgPath, 'utf8'));
    const overridesKey = pm === 'yarn' ? 'resolutions' : 'overrides';
    pkg[overridesKey] = {
      ...pkg[overridesKey],
      '@linteljs/eslint-config': `file:${configTarball}`,
      '@linteljs/eslint-plugin': `file:${pluginTarball}`,
    };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
};

export const verifyLintOutput = (pm: PackageManager, project: string): void => {
  // Proves the override took rather than assuming it
  const why = runPm(pm, ['why', '@linteljs/eslint-plugin'], project);

  expect(why.output).toContain('@linteljs/eslint-plugin');
  expect(why.output).toContain('@linteljs/eslint-config');

  // ESLint exits 2 on a configuration failure and 1 when it ran and found problems
  const lint = runPm(pm, ['lint'], project);

  expect(lint.status < 2 ? 'eslint ran' : `eslint config error\n${lint.output}`).toBe('eslint ran');

  // Zero, with no per-target allowance: an exception here is a finding the pipeline failed to repair
  const found = Number(/✖ (\d+) problem/.exec(lint.output)?.[1] ?? '0');

  expect(`${String(found)} findings\n${found === 0 ? '' : lint.output}`).toBe('0 findings\n');

  // Runs `check` rather than its five commands separately, so the gate has one definition
  expect(outcome(runPm(pm, ['check'], project), 'check')).toBe('check: ok');
};

// Runs the full e2e test for a given set of answers.
export const runE2eCase = ({ label, answers }: { label: string;
  answers: Answers; }): void => {
  const root = join(workspace, label.replaceAll(' ', '-'));
  // The target id doubles as the project name, except `react-native`: `create-expo-app` rejects a name matching one
  // of its own dependencies, so this is a legal name choice, not a workaround.
  const name = answers.target === 'react-native' ? 'rn-app' : answers.target;
  const project = join(root, name);

  scaffoldProject(root, name, answers, project);

  const generate = generateLintel(project);

  expect(outcome(generate, '@linteljs/create')).toBe('@linteljs/create: ok');
  expect(existsSync(join(project, 'eslint.config.js'))).toBe(true);
  expect(existsSync(join(project, CONFIG_PATH))).toBe(true);
  expect(parseLintelConfig(readFileSync(join(project, CONFIG_PATH), 'utf8')))
    .toMatchObject(answers);
  expect(parsePackageJson(readFileSync(join(project, 'package.json'), 'utf8')))
    .not.toHaveProperty('lintel');

  applyTarballOverrides(project, answers.packageManager);

  // Stages 2-6, including install and the eslint --fix pass
  const complete = runInstallingCli(project, answers.packageManager);

  expect(outcome(complete, '@linteljs/create install+fix')).toBe('@linteljs/create install+fix: ok');
  expect(complete.output).not.toContain('next: ');

  verifyLintOutput(answers.packageManager, project);
};
