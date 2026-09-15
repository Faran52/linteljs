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

// Packed tarballs, not the workspace: a workspace install dedupes plugin instances and hides `Cannot redefine plugin`.
export const TARBALL_DIR = env['LINTEL_TARBALLS'] ?? resolve(import.meta.dirname, '../../../../../../.e2e');

// Exactly one tarball per package, and never a skip: `test:e2e` packs immediately before this suite, and a suite
// that skipped once reported green having installed nothing.
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

// pnpm pack flattens the scope into the filename.
export const configTarball = tarballFor('linteljs-eslint-config');
export const pluginTarball = tarballFor('linteljs-eslint-plugin');
export const cliTarball = tarballFor('linteljs-create');

export const run = (command: string, args: string[], cwd: string, input = ''): RunResult => {
  const result = spawnSync(command, args, {
    cwd,
    input,
    encoding: 'utf8',
    // A host config pinning a private registry must not be inherited silently.
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

// A tarball is not an installation: without the runtime dependencies the packed binary dies on ERR_MODULE_NOT_FOUND.
// Production only, `--prefer-offline` so the cache serves it.
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
    // `--skip package`: the first pass wrote package.json, and a second write would put the registry range back over
    // the tarball the direct dependency now names, which npm refuses as EOVERRIDE.
    return run(
      'node',
      [join(root, 'package/bin/create-linteljs.js'), '--skip-scaffold', '--fresh', '--skip', 'package'],
      project,
    );
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

export const scaffoldProject = (
  root: string,
  name: string,
  answers: Answers,
  project: string,
): void => {
  mkdirSync(root, { recursive: true });

  // Stage 1 builds the same argv from the same `scaffoldCommand`.
  const spec = targetFor(answers).scaffold(name, answers);
  const [command, ...argv] = scaffoldCommand(answers.packageManager, spec);

  const scaffold = run(command, argv, root);

  expect(existsSync(join(project, 'package.json')) ? 'scaffolded' : scaffold.output).toBe('scaffolded');

  // Writing `lintel.config.json` is the honest equivalent of a person having answered once, with no pty to script.
  writeFileSync(join(project, CONFIG_PATH), emitLintelConfig(answers), 'utf8');
};

export const generateLintel = (project: string): RunResult => {
  // `--fresh` turns starter fixes on; `--no-install` so the tarball overrides land before install.
  return run(
    'node',
    [join(installCli(), 'package/bin/create-linteljs.js'), '--skip-scaffold', '--fresh', '--no-install'],
    project,
  );
};

export const applyTarballOverrides = (project: string, pm: PackageManager): void => {
  // pnpm uses `pnpm-workspace.yaml`; npm, yarn and bun use `package.json`.
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
    // npm refuses an override that disagrees with the direct dependency (EOVERRIDE), so the direct one moves too.
    pkg.devDependencies = {
      ...pkg.devDependencies,
      '@linteljs/eslint-config': `file:${configTarball}`,
    };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
};

export const verifyLintOutput = (pm: PackageManager, project: string): void => {
  // Proves the override took.
  const why = runPm(pm, ['why', '@linteljs/eslint-plugin'], project);

  expect(why.output).toContain('@linteljs/eslint-plugin');
  expect(why.output).toContain('@linteljs/eslint-config');

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

  const complete = runInstallingCli(project, answers.packageManager);

  expect(outcome(complete, '@linteljs/create install+fix')).toBe('@linteljs/create install+fix: ok');
  expect(complete.output).not.toContain('next: ');

  verifyLintOutput(answers.packageManager, project);
};
