import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from 'node:process';

import { inject } from 'vitest';

import { parsePackageJson } from '../../../artifacts/package-json/emitPackageJson';
import {
  type Answers,
  DEFAULT_ANSWERS,
  type PackageManager,
} from '../../../model/answers/answers';
import { CONFIG_PATH, parseLintelConfig } from '../../../model/config/lintelConfig';

export interface RunResult {
  status: number;
  output: string;
}

const registry = inject('registry');

// Every manager, and every scaffolder and install the CLI spawns, reads the workspace registry from its environment.
const LAUNCHER_KEYS = new Set(['npm_execpath', 'npm_node_execpath', 'npm_config_user_agent']);

export const run = (command: string, args: string[], cwd: string, input = ''): RunResult => {
  /**
   * A generated project must not inherit which manager launched this suite. `run-p` reads `npm_execpath` to choose
   * what it spawns, and `pnpm run test:e2e` sets it, so `vue on bun` ran pnpm inside a project pinned to bun and got
   * `ERR_PNPM_OTHER_PM_EXPECTED`. Set under `pnpm run` and not `pnpm exec`, which is why it passed one way and
   * failed the other. `npm_config_registry` and the cache paths below are this suite's own and stay.
   */
  const parentEnv = Object.fromEntries(Object.entries(env).filter(([key]) => {
    return !LAUNCHER_KEYS.has(key) && !key.startsWith('npm_package_') && !key.startsWith('npm_lifecycle_');
  }));

  const result = spawnSync(command, args, {
    cwd,
    input,
    encoding: 'utf8',
    env: {
      ...parentEnv,
      npm_config_registry: registry.url,
      NPM_CONFIG_REGISTRY: registry.url,
      pnpm_config_registry: registry.url,
      // pnpm 12 and Yarn 4 refuse a version younger than their age gate, and the workspace ones are seconds old.
      pnpm_config_minimum_release_age: '0',
      BUN_CONFIG_REGISTRY: registry.url,
      YARN_NPM_REGISTRY_SERVER: registry.url,
      YARN_UNSAFE_HTTP_WHITELIST: '127.0.0.1',
      YARN_NPM_MINIMAL_AGE_GATE: '0',
      /**
       * Split by what each directory remembers, because this suite republishes one version many times. Anything
       * recording which tarball a version resolved to starts empty every run, or the manager serves the previous
       * run's build: bun reported `Integrity check failed` on every target, and pnpm handed React Native a plugin
       * from before its rules existed. Anything content-addressed is keyed by the bytes it holds, cannot go stale,
       * and persists so the other 1300 packages are still reused. npm's cacache is integrity-keyed and needs
       * neither treatment; bun offers no split, so the whole cache is per run.
       */
      npm_config_cache: join(registry.cacheDir, 'npm'),
      pnpm_config_store_dir: join(registry.cacheDir, 'pnpm-store'),
      pnpm_config_cache_dir: join(registry.runDir, 'pnpm-cache'),
      /**
       * Split on purpose. The global folder holds yarn's registry metadata, which records the tarball a version
       * resolves to, and this suite republishes one version many times, so that half must start empty every run. The
       * cache folder holds the downloads, whose filenames carry a checksum, so changed contents land beside the old
       * ones rather than on top and the other 1300 packages are still reused. Deleting the cache outright instead
       * made a single-process registry serve the whole tree again and took four green files red.
       */
      YARN_GLOBAL_FOLDER: join(registry.runDir, 'yarn'),
      YARN_CACHE_FOLDER: join(registry.cacheDir, 'yarn-cache'),
      BUN_INSTALL_CACHE_DIR: join(registry.runDir, 'bun'),
    },
  });

  return {
    status: result.status ?? 1,
    output: `${result.stdout}${result.stderr}`,
  };
};

// Folds the exit status into the asserted value, so a failure prints the process output.
export const outcome = (result: RunResult, label: string): string => {
  return result.status === 0 ? `${label}: ok` : `${label}: exit ${String(result.status)}\n${result.output}`;
};

// The one failure worth retrying: a scaffolder pins the version it just saw, and `create astro` once asked for a
// version 33 seconds before it was published. Matched on the error code, since any other failure is real.
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

// `why` and a script name, spelled the way each manager wants them.
const SPELLINGS: Record<PackageManager, Record<string, string[]>> = {
  pnpm: {},
  yarn: {},
  npm: {
    why: ['ls'],
    lint: ['run', 'lint'],
    check: ['run', 'check'],
  },
  bun: { why: ['pm', 'ls', '--all'] },
};

export const runPm = (pm: PackageManager, args: string[], project: string): RunResult => {
  const mapped = args.flatMap((arg) => {
    return SPELLINGS[pm][arg] ?? [arg];
  });

  return run(pm, mapped, project);
};

export const workspace = mkdtempSync(join(tmpdir(), 'lintel-e2e-'));

export const afterAllCleanup = (): void => {
  rmSync(workspace, {
    recursive: true,
    force: true,
  });
};

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

// The answers as a person would type them; a flag a target never asks for is refused, so those go only when set.
export const answerFlags = (answers: Answers): string[] => {
  return [
    '--target', answers.target,
    '--pm', answers.packageManager,
    '--testing', answers.testing,
    '--type-safety', answers.typeSafety,
    '--libraries', answers.libraries.join(','),
    '--agents', answers.agents.join(','),
    '--plugins', answers.plugins.join(','),
    ...(answers.target === 'webextension' ? ['--browser', answers.browser] : []),
    ...(answers.hostedFramework === undefined ? [] : ['--hosted', answers.hostedFramework]),
    ...(answers.surfaces === undefined ? [] : ['--surfaces', answers.surfaces.join(',')]),
    ...(answers.router === undefined ? [] : ['--router', answers.router]),
    ...(answers.store ? ['--store'] : []),
  ];
};

// One command from an empty parent directory, which is the whole of what a user does.
export const createProject = (root: string, name: string, answers: Answers): RunResult => {
  mkdirSync(root, { recursive: true });

  const attempt = (): RunResult => {
    rmSync(join(root, name), {
      recursive: true,
      force: true,
    });

    return run('node', [registry.cliBin, name, ...answerFlags(answers)], root);
  };

  const first = attempt();

  return first.status === 0 || !isUnpublishedYet(answers.packageManager, first.output) ? first : attempt();
};

/**
 * Never asserted on, for any manager. A deprecation notice reports that a third-party package reached end of life,
 * which is true of trees this CLI does not choose: `expo` reaches a deprecated `uuid` through the Xcode writer, and
 * a scaffolder installs `expo`, not lintel. No emitted config makes it go away, and muting it in a generated project
 * would hide a real fact from whoever does own the dependency.
 */
const DEPRECATION = /deprecated/i;

// What each manager prints when an install was not clean. Yarn's codes carry no severity, so its summary line
// decides and every coded line but the banner is then shown.
const INSTALL_NOISE: Record<PackageManager, (output: string) => string[]> = {
  pnpm: (output) => {
    // `Request took` and the speed notice are this suite's own registry on a cold fetch, not the project.
    return (output.match(/^.*(?:\bWARN\b|Ignored build scripts).*$/gm) ?? []).filter((line) => {
      return !line.includes('Request took')
        && !line.includes('Tarball download average speed')
        && !DEPRECATION.test(line);
    });
  },
  /**
   * `npm warn exec` is npx fetching the scaffolder itself, in the stage before this one. It is matched by name rather
   * than cut with the others, because npm writes it to stderr and `run` appends stderr whole after stdout, so the
   * stage boundary below does not contain it.
   */
  npm: (output) => {
    return (output.match(/^npm (?:warn|WARN).*$/gm) ?? []).filter((line) => {
      return !line.startsWith('npm warn exec') && !DEPRECATION.test(line);
    });
  },
  yarn: (output) => {
    return output.includes('Done with warnings')
      ? (output.match(/^.*YN0(?!000)\d{3}.*$/gm) ?? []).filter((line) => {
          return !DEPRECATION.test(line);
        })
      : [];
  },
  bun: (output) => {
    return (output.match(/^.*(?:\bwarn:|Blocked \d+ postinstall).*$/gm) ?? []).filter((line) => {
      // `Slow filesystem` names this suite's own cache directory, which is a fact about the machine, not the project.
      return !DEPRECATION.test(line) && !line.includes('Slow filesystem detected');
    });
  },
};

export const verifyLintOutput = (pm: PackageManager, project: string): void => {
  // Proves the install resolved the workspace versions rather than anything published.
  const why = runPm(pm, ['why', '@linteljs/eslint-plugin'], project);

  const version = registry.version.replaceAll('.', String.raw`\.`);

  expect(why.output).toMatch(new RegExp(`@linteljs/eslint-plugin[@ ](npm:)?${version}`));
  expect(why.output).toMatch(new RegExp(`@linteljs/eslint-config[@ ](npm:)?${version}`));

  // ESLint exits 2 on a configuration failure and 1 on findings.
  const lint = runPm(pm, ['lint'], project);

  expect(lint.status < 2 ? 'eslint ran' : `eslint config error\n${lint.output}`).toBe('eslint ran');

  // Zero, with no per-target allowance.
  const found = Number(/✖ (\d+) problem/.exec(lint.output)?.[1] ?? '0');

  expect(`${String(found)} findings\n${found === 0 ? '' : lint.output}`).toBe('0 findings\n');

  // `check`, so the gate has one definition.
  expect(outcome(runPm(pm, ['check'], project), 'check')).toBe('check: ok');
};

export const runE2eCase = ({ label, answers }: { label: string;
  answers: Answers; }): void => {
  const root = join(workspace, label.replaceAll(' ', '-'));
  // `create-expo-app` rejects a name matching one of its own dependencies.
  const name = answers.target === 'react-native' ? 'rn-app' : answers.target;
  const project = join(root, name);

  const create = createProject(root, name, answers);

  expect(outcome(create, '@linteljs/create')).toBe('@linteljs/create: ok');
  expect(create.output).not.toContain('next: ');
  // From the install stage on: what a scaffolder's own `npx` or `dlx` prints before lintel exists is not lintel's.
  const installed = create.output.slice(create.output.indexOf('installing with '));

  expect(INSTALL_NOISE[answers.packageManager](installed)).toEqual([]);
  // `prepare` (`postinstall` on yarn) ran: husky writes its runner there.
  expect(existsSync(join(project, '.husky/_'))).toBe(true);
  expect(existsSync(join(project, 'eslint.config.js'))).toBe(true);
  expect(parseLintelConfig(readFileSync(join(project, CONFIG_PATH), 'utf8')))
    .toMatchObject(answers);
  expect(parsePackageJson(readFileSync(join(project, 'package.json'), 'utf8')))
    .not.toHaveProperty('lintel');

  verifyLintOutput(answers.packageManager, project);
};
