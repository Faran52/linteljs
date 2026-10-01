import {
  existsSync,
  globSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { expect } from 'vitest';

import { CONFIG_PATH, parseLinteljsConfig } from '@answers';
import { parsePackageJson } from '@emitters';

import { browserProblems } from '../browser/browser';
import {
  oneAtATime,
  outcome,
  registry,
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

import type { PackageManager } from '@config/types';
import type { E2eCase } from '../matrix/matrix';

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

const verifyLintOutput = async (pm: PackageManager, project: string): Promise<void> => {
  // One `why` per package.
  const version = registry.version.replaceAll('.', String.raw`\.`);

  for (const name of ['@linteljs/eslint-plugin', '@linteljs/eslint-config']) {
    const why = await runPm(pm, ['why', name], project);

    expect(why.output).toMatch(new RegExp(`${name}[@ ](npm:)?${version}`));
  }

  const check = await runPm(pm, ['check'], project);

  expect(outcome(check, 'check')).toBe('check: ok');

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
        return readFileSync(join(project, file), 'utf8');
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

  return [...classes]
    .filter((name) => {
      return !new RegExp(String.raw`\.${name}\b`).test(styles);
    })
    .join(' ');
};

export const runE2eCase = async ({
  label,
  answers,
  variant,
}: E2eCase): Promise<void> => {
  const root = join(workspace, label.replaceAll(' ', '-'));
  const name = answers.target;
  const project = join(root, name);

  const flags = variant === undefined ? undefined : CREATE_FLAGS[variant];
  const create = await createProject(root, name, answers, flags);
  // A skipped fix pass reports nothing.
  const expectedFixes = flags === undefined ? CLEAN_FIXES : null;

  expect(outcome(create, '@linteljs/create')).toBe('@linteljs/create: ok');

  // Emitted code lands clean: the fix stage brings an existing project into line, and a fresh one needs none.
  const fixes = create.output.match(/\b(?:eslint|stylelint) --fix: [^\n]*/g);

  expect(fixes).toEqual(expectedFixes);

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
  expect(existsSync(join(project, '.husky/_'))).toBe(true);
  expect(existsSync(join(project, 'eslint.config.js'))).toBe(true);

  // The manager came from the injected user agent, so the recorded config proves it was read.
  expect(parseLinteljsConfig(readFileSync(join(project, CONFIG_PATH), 'utf8'))).toMatchObject({
    ...answers,
    packageManagerVersion: await versionOf(answers.packageManager),
  });

  expect(parsePackageJson(readFileSync(join(project, 'package.json'), 'utf8')))
    .not.toHaveProperty('linteljs');

  // npm exits non-zero on a peer it resolved to an invalid range.
  if (answers.packageManager === 'npm') {
    expect(outcome(await runPm('npm', ['ls', '--all'], project), 'npm ls')).toBe('npm ls: ok');
  }

  await verifyLintOutput(answers.packageManager, project);

  if (answers.styling === 'stylex') {
    expect(missingStylexRules(project)).toBe('');
  }

  if (variant === 'browser') {
    const seen = await browserProblems(answers.packageManager, project);

    expect(seen).toEqual([]);
  }
};
