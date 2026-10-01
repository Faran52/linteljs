import {
  existsSync,
  globSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { env } from 'node:process';

import { expect } from 'vitest';

import { CONFIG_PATH, parseLinteljsConfig } from '@answers';
import { parsePackageJson } from '@emitters';

import {
  outcome,
  registry,
  runPm,
} from '../utils/processUtils';
import {
  createProject,
  versionOf,
  workspace,
} from '../utils/workspaceUtils';

import {
  DEPRECATION,
  STYLEX_CLASSES,
  SVELTEKIT_VERSION_HASH,
  YARN_CLASSIC_UPSTREAM,
} from './constants';

import type { PackageManager } from '@config/types';
import type { E2eCase } from '../matrix/matrix';

const INSTALL_NOISE: Record<PackageManager, (output: string) => string[]> = {
  'pnpm': (output) => {
    // `Request took` and the speed notice are this suite's own registry on a cold fetch.
    return (output.match(/^.*(?:\bWARN\b|Ignored build scripts).*$/gm) ?? [])
      .filter((line) => {
        return !line.includes('Request took')
          && !line.includes('Tarball download average speed')
          && !DEPRECATION.test(line);
      });
  },
  'npm': (output) => {
    return (output.match(/^npm (?:warn|WARN).*$/gm) ?? [])
      .filter((line) => {
        return !DEPRECATION.test(line);
      });
  },
  // YN0000, YN0007, YN0013 and YN0085 only narrate a cold install.
  'yarn': (output) => {
    return output.includes('Done with warnings')
      ? (output.match(/^.*YN0(?!000|007|013|085)\d{3}.*$/gm) ?? [])
          .filter((line) => {
            return !DEPRECATION.test(line);
          })
      : [];
  },
  'yarn-classic': (output) => {
    return (output.match(/^warning .*$/gm) ?? [])
      .filter((line) => {
        return !DEPRECATION.test(line) && !YARN_CLASSIC_UPSTREAM.test(line);
      });
  },
  'bun': (output) => {
    return (output.match(/^.*(?:\bwarn:|Blocked \d+ postinstall).*$/gm) ?? [])
      .filter((line) => {
        // `Slow filesystem` names this suite's own cache directory.
        return !DEPRECATION.test(line) && !line.includes('Slow filesystem detected');
      });
  },
};

const verifyLintOutput = async (pm: PackageManager, project: string): Promise<void> => {
  // One `why` per package: yarn 1 names a dependent without its version.
  const version = registry.version.replaceAll('.', String.raw`\.`);

  for (const name of ['@linteljs/eslint-plugin', '@linteljs/eslint-config']) {
    const why = await runPm(pm, ['why', name], project);

    expect(why.output).toMatch(new RegExp(`${name}[@ ](npm:)?${version}`));
  }

  // ESLint exits 2 on a configuration failure and 1 on findings.
  const lint = await runPm(pm, ['lint'], project);

  expect(lint.status < 2 ? 'eslint ran' : `eslint config error\n${lint.output}`).toBe('eslint ran');

  // Zero, with no per-target allowance.
  const found = Number(/✖ (\d+) problem/.exec(lint.output)?.[1] ?? '0');

  expect(`${String(found)} findings\n${found === 0 ? '' : lint.output}`).toBe('0 findings\n');

  expect(outcome(await runPm(pm, ['check'], project), 'check')).toBe('check: ok');
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

export const runE2eCase = async ({ label, answers }: E2eCase): Promise<void> => {
  const root = join(workspace, label.replaceAll(' ', '-'));
  const name = answers.target;
  const project = join(root, name);

  const create = await createProject(root, name, answers);

  expect(outcome(create, '@linteljs/create')).toBe('@linteljs/create: ok');

  // `lint:starters:typed`: an installed project and its own lint alone, the one gate a typed rule shows in.
  if (env['E2E_TYPED_LINT'] === '1') {
    const lint = await runPm(answers.packageManager, [
      'exec',
      'eslint',
      '.',
      '--max-warnings',
      '0',
    ], project);

    expect(outcome(lint, `${name} eslint`)).toBe(`${name} eslint: ok`);

    return;
  }

  expect(create.output).not.toContain('next: ');
  expect(INSTALL_NOISE[answers.packageManager](create.output)).toEqual([]);
  expect(existsSync(join(project, '.husky/_'))).toBe(true);
  expect(existsSync(join(project, 'eslint.config.js'))).toBe(true);
  // The manager came from the injected user agent, so the recorded config proves it was read.
  expect(parseLinteljsConfig(readFileSync(join(project, CONFIG_PATH), 'utf8'))).toMatchObject({
    ...answers,
    packageManagerVersion: await versionOf(answers.packageManager),
  });
  expect(parsePackageJson(readFileSync(join(project, 'package.json'), 'utf8')))
    .not.toHaveProperty('linteljs');

  await verifyLintOutput(answers.packageManager, project);

  if (answers.styling === 'stylex') {
    expect(missingStylexRules(project)).toBe('');
  }
};
