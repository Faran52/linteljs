import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from 'vitest';

import {
  CONFIG_PATH,
  type PackageManager,
  parseLinteljsConfig,
} from '#answers';
import { parsePackageJson } from '#emitters/always/package-json/packageJsonEmitter';

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

import { DEPRECATION, YARN_CLASSIC_UPSTREAM } from './constants';

import type { E2eCase } from '../matrix/matrix';

// What each manager prints when an install was not clean.
const INSTALL_NOISE: Record<PackageManager, (output: string) => string[]> = {
  'pnpm': (output) => {
    // `Request took` and the speed notice are this suite's own registry on a cold fetch, not the project.
    return (output.match(/^.*(?:\bWARN\b|Ignored build scripts).*$/gm) ?? []).filter((line) => {
      return !line.includes('Request took')
        && !line.includes('Tarball download average speed')
        && !DEPRECATION.test(line);
    });
  },
  'npm': (output) => {
    return (output.match(/^npm (?:warn|WARN).*$/gm) ?? []).filter((line) => {
      return !DEPRECATION.test(line);
    });
  },
  /*
   * Yarn's summary decides; then every coded line counts but the ones that only narrate a cold install: YN0000 the
   * banner, YN0007 a package built for the first time, YN0013 packages fetched, YN0085 the resolution delta.
   */
  'yarn': (output) => {
    return output.includes('Done with warnings')
      ? (output.match(/^.*YN0(?!000|007|013|085)\d{3}.*$/gm) ?? []).filter((line) => {
          return !DEPRECATION.test(line);
        })
      : [];
  },
  // Yarn 1 has no codes: every line it wants read starts with the word.
  'yarn-classic': (output) => {
    return (output.match(/^warning .*$/gm) ?? []).filter((line) => {
      return !DEPRECATION.test(line) && !YARN_CLASSIC_UPSTREAM.test(line);
    });
  },
  'bun': (output) => {
    return (output.match(/^.*(?:\bwarn:|Blocked \d+ postinstall).*$/gm) ?? []).filter((line) => {
      // `Slow filesystem` names this suite's own cache directory, which is a fact about the machine, not the project.
      return !DEPRECATION.test(line) && !line.includes('Slow filesystem detected');
    });
  },
};

export const verifyLintOutput = async (pm: PackageManager, project: string): Promise<void> => {
  // Proves the install resolved the workspace versions rather than anything published. One `why` per package: yarn 1
  // names a dependent without its version, so only a package's own answer carries it on every manager.
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

  // `check`, so the gate has one definition.
  expect(outcome(await runPm(pm, ['check'], project), 'check')).toBe('check: ok');
};

export const runE2eCase = async ({ label, answers }: E2eCase): Promise<void> => {
  const root = join(workspace, label.replaceAll(' ', '-'));
  const name = answers.target;
  const project = join(root, name);

  const create = await createProject(root, name, answers);

  expect(outcome(create, '@linteljs/create')).toBe('@linteljs/create: ok');
  expect(create.output).not.toContain('next: ');
  // The whole run: nothing but linteljs and the install it spawns writes to it.
  expect(INSTALL_NOISE[answers.packageManager](create.output)).toEqual([]);
  // `prepare` (`postinstall` on yarn) ran: husky writes its runner there.
  expect(existsSync(join(project, '.husky/_'))).toBe(true);
  expect(existsSync(join(project, 'eslint.config.js'))).toBe(true);
  // The manager came from the injected user agent rather than a flag, so what the config recorded is the proof it
  // was read, down to the version.
  expect(parseLinteljsConfig(readFileSync(join(project, CONFIG_PATH), 'utf8'))).toMatchObject({
    ...answers,
    packageManagerVersion: await versionOf(answers.packageManager),
  });
  expect(parsePackageJson(readFileSync(join(project, 'package.json'), 'utf8')))
    .not.toHaveProperty('linteljs');

  await verifyLintOutput(answers.packageManager, project);
};
