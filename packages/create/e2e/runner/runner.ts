import {
  existsSync,
  globSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { pick } from 'es-toolkit';
import { expect } from 'vitest';

import { projectDirectoryOf } from '@utils/answerUtils';

import {
  CONFIG_PATH,
  parseLinteljsConfig,
  projectAnswersOf,
  WORKSPACE_KEYS,
} from '@answers';
import { parsePackageJson } from '@emitters';
import { targetFor } from '@targets';

import { browserProblems } from '../browser/browser';
import { type E2eCase, projectsOf } from '../matrix/matrix';
import { removedAfter } from '../utils/cleanupUtils';
import {
  oneAtATime,
  outcome,
  registry,
  run,
  runPm,
  type RunResult,
} from '../utils/processUtils';
import {
  createProject,
  versionOf,
  workspace,
} from '../utils/workspaceUtils';

import {
  CLEAN_FIXES,
  CREATE_FLAGS,
  DEPRECATION,
  LINT_PROBLEMS,
  STYLEX_CLASSES,
  SVELTEKIT_VERSION_HASH,
} from './constants';

import type { Answers, PackageManager } from '@config/types';

interface ProjectDir {
  answers: Answers;
  dir: string;
}

const INSTALL_NOISE: Record<PackageManager, (output: string) => string[]> = {
  pnpm: (output) => {
    // `Request took` and the speed notice are this suite's own registry on a cold fetch.
    return (output.match(/^.*(?:\bWARN\b|Ignored build scripts).*$/gm) ?? [])
      .filter((line) => {
        return !line.includes('Request took')
          && !line.includes('Tarball download average speed')
          && !DEPRECATION.test(line);
      });
  },
  npm: (output) => {
    return (output.match(/^npm (?:warn|WARN).*$/gm) ?? [])
      .filter((line) => {
        return !DEPRECATION.test(line);
      });
  },
  // YN0000, YN0007, YN0013 and YN0085 only narrate a cold install.
  yarn: (output) => {
    return output.includes('Done with warnings')
      ? (output.match(/^.*YN0(?!000|007|013|085)\d{3}.*$/gm) ?? [])
          .filter((line) => {
            return !DEPRECATION.test(line);
          })
      : [];
  },
  bun: (output) => {
    return (output.match(/^.*(?:\bwarn:|Blocked \d+ postinstall).*$/gm) ?? [])
      .filter((line) => {
        // `Slow filesystem` names this suite's own cache directory.
        return !DEPRECATION.test(line) && !line.includes('Slow filesystem detected');
      });
  },
};

// Each project's derived directory: the root in a single layout, `apps/` or `packages/` in a monorepo.
const projectDirsOf = (item: E2eCase, project: string): ProjectDir[] => {
  return projectsOf(item, item.answers.target)
    .map(({ name, answers }) => {
      const dir = join(project, projectDirectoryOf(answers, name));
      const projectDir: ProjectDir = {
        answers,
        dir,
      };

      return projectDir;
    });
};

const verifyLintOutput = async (pm: PackageManager, project: string): Promise<void> => {
  const version = registry.version.replaceAll('.', String.raw`\.`);
  const configPackages = ['@linteljs/eslint-plugin', '@linteljs/eslint-config'];

  for (const name of configPackages) {
    const why = await runPm(pm, ['why', name], project);

    expect(why.output).toMatch(new RegExp(`${name}[@ ](npm:)?${version}`));
  }

  const check = await runPm(pm, ['check'], project);
  const checked = outcome(check, 'check');

  expect(checked).toBe('check: ok');

  // Zero, warnings included, with no per-target allowance: `eslint .` passes on warnings.
  const problems = LINT_PROBLEMS.exec(check.output);
  const found = Number(problems?.[1] ?? '0');

  expect(`${String(found)} findings\n${found === 0 ? '' : check.output}`).toBe('0 findings\n');
};

// A build that drops the atomic rules still passes `check`.
const missingStylexRules = (project: string): string => {
  const files = globSync('{dist,build,.output,.svelte-kit/output,.next}/**/*.{js,mjs,html,css}', { cwd: project });

  const joined = (css: boolean): string => {
    return files
      .filter((file) => {
        return file.endsWith('.css') === css;
      })
      .map((file) => {
        const path = join(project, file);

        return readFileSync(path, 'utf8');
      })
      .join('\n');
  };

  const styles = joined(true);
  const classNames = (joined(false)
    .replaceAll(SVELTEKIT_VERSION_HASH, '')
    .match(STYLEX_CLASSES) ?? [])
    .flatMap((run) => {
      return run.split(' ');
    });

  const classes = new Set(classNames);
  const missing = [...classes]
    .filter((name) => {
      return !new RegExp(String.raw`\.${name}\b`).test(styles);
    })
    .join(' ');

  return missing;
};

const expectCreated = async ({
  answers,
  variant,
  projects,
}: E2eCase, root: string): Promise<RunResult> => {
  const flags = variant === undefined ? undefined : CREATE_FLAGS[variant];
  const create = await createProject(root, answers.target, answers, flags, projects);
  // A skipped fix pass reports nothing.
  const expectedFixes = flags === undefined ? CLEAN_FIXES : null;

  const created = outcome(create, '@linteljs/create');

  expect(created).toBe('@linteljs/create: ok');

  // Emitted code lands clean: the fix stage brings an existing project into line, and a fresh one needs none.
  const fixes = create.output.match(/\b(?:eslint|stylelint) --fix: [^\n]*/g);

  expect(fixes).toEqual(expectedFixes);

  return create;
};

const expectInstalled = async (item: E2eCase, create: RunResult, project: string): Promise<void> => {
  const { answers, variant } = item;

  // The install a user runs after `--no-install`, under the same lifecycle.
  const installLater = async (): Promise<RunResult> => {
    return runPm(answers.packageManager, ['install'], project);
  };

  let install: RunResult | undefined;

  if (variant === 'no-install') {
    install = await oneAtATime(answers.packageManager, installLater);
  }

  const installed = install === undefined ? 'install: ok' : outcome(install, 'install');
  const installOutput = `${create.output}${install?.output ?? ''}`;
  const noise = INSTALL_NOISE[answers.packageManager](installOutput);

  expect(installed).toBe('install: ok');
  expect(create.output).not.toContain('next: ');
  expect(noise).toEqual([]);

  for (const app of projectDirsOf(item, project)) {
    const { publicDirectory } = targetFor(app.answers);

    if (app.answers.mocking === 'msw' && publicDirectory !== undefined) {
      const hasWorker = existsSync(join(app.dir, publicDirectory, 'mockServiceWorker.js'));

      expect(hasWorker).toBe(true);
    }
  }
};

const expectRecorded = async (item: E2eCase, project: string): Promise<void> => {
  const { answers } = item;
  const hasHooks = existsSync(join(project, '.husky/_'));

  expect(hasHooks).toBe(true);

  const hasLintConfig = existsSync(join(project, 'eslint.config.ts'));

  expect(hasLintConfig).toBe(true);

  // The manager came from the injected user agent, so the recorded config proves it was read.
  const configText = readFileSync(join(project, CONFIG_PATH), 'utf8');
  const config = parseLinteljsConfig(configText);
  const managerVersion = await versionOf(answers.packageManager);
  const recorded = config.projects
    .map((projectConfig) => {
      return projectAnswersOf(config, projectConfig);
    });
  // The workspace answers are the first project's; each project's flags carry only its own.
  const expected = projectsOf(item, '')
    .map(({ answers: projectAnswers }) => {
      const asked: Answers = {
        ...projectAnswers,
        ...pick(answers, WORKSPACE_KEYS),
        packageManagerVersion: managerVersion,
      };

      return asked;
    });

  expect(recorded).toMatchObject(expected);

  if (item.projects !== undefined) {
    const names = config.projects
      .map(({ name }) => {
        return name;
      });
    const expectedNames = item.projects
      .map(({ name }) => {
        return name;
      });

    expect(names).toEqual(expectedNames);
  }

  const manifestText = readFileSync(join(project, 'package.json'), 'utf8');
  const manifest = parsePackageJson(manifestText);

  expect(manifest)
    .not.toHaveProperty('linteljs');
};

// Through the hooks: lint-staged in each package and commitlint at the root.
const expectCommitted = async (project: string): Promise<void> => {
  const added = await run('git', ['add', '--all'], project);
  const committed = await run('git', [
    '-c',
    'user.name=e2e',
    '-c',
    'user.email=e2e@example.invalid',
    'commit',
    '--message',
    'feat: start the workspace',
  ], project);
  const results = [outcome(added, 'git add'), outcome(committed, 'git commit')];

  expect(results).toEqual(['git add: ok', 'git commit: ok']);
};

const expectAdded = async ({ answers }: E2eCase, project: string): Promise<void> => {
  const add = await run('node', [
    registry.cliBin,
    'sync',
    '--add',
    'lib',
  ], project);
  const install = await runPm(answers.packageManager, ['install'], project);
  const results = [outcome(add, 'sync --add'), outcome(install, 'install')];

  expect(results).toEqual(['sync --add: ok', 'install: ok']);
};

const expectWorking = async (item: E2eCase, project: string): Promise<void> => {
  const { answers, variant } = item;

  // npm exits non-zero on a peer it resolved to an invalid range.
  if (answers.packageManager === 'npm') {
    const listing = await runPm('npm', ['ls', '--all'], project);
    const listed = outcome(listing, 'npm ls');

    expect(listed).toBe('npm ls: ok');
  }

  await verifyLintOutput(answers.packageManager, project);

  if (answers.layout === 'monorepo') {
    await expectCommitted(project);
  }

  const stylex = projectDirsOf(item, project)
    .filter((app) => {
      return app.answers.styling === 'stylex';
    });

  for (const app of stylex) {
    const unstyled = missingStylexRules(app.dir);

    expect(unstyled).toBe('');
  }

  if (variant === 'browser') {
    const seen = await browserProblems(answers, project);

    expect(seen).toEqual([]);
  }
};

const checkCase = async (item: E2eCase, root: string): Promise<void> => {
  const project = join(root, item.answers.target);
  const create = await expectCreated(item, root);

  await expectInstalled(item, create, project);
  await expectRecorded(item, project);

  if (item.variant === 'add') {
    await expectAdded(item, project);
  }

  await expectWorking(item, project);
};

export const runE2eCase = async (item: E2eCase): Promise<void> => {
  const root = join(workspace, item.label.replaceAll(' ', '-'));

  await removedAfter(root, async () => {
    await checkCase(item, root);
  });
};
