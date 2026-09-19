import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect } from 'vitest';

import { CONFIG_PATH, parseLintelConfig } from '../../answers/lintelConfig';
import { parsePackageJson } from '../../emitters/package-json/packageJsonEmitter';

import {
  outcome,
  registry,
  runPm,
} from './utils/processUtils';
import { createProject, workspace } from './utils/workspaceUtils';

import type { PackageManager } from '../../answers/answers';
import type { E2eCase } from './cases';

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

export const verifyLintOutput = async (pm: PackageManager, project: string): Promise<void> => {
  // Proves the install resolved the workspace versions rather than anything published.
  const why = await runPm(pm, ['why', '@linteljs/eslint-plugin'], project);

  const version = registry.version.replaceAll('.', String.raw`\.`);

  expect(why.output).toMatch(new RegExp(`@linteljs/eslint-plugin[@ ](npm:)?${version}`));
  expect(why.output).toMatch(new RegExp(`@linteljs/eslint-config[@ ](npm:)?${version}`));

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
  // `create-expo-app` rejects a name matching one of its own dependencies.
  const name = answers.target === 'react-native' ? 'rn-app' : answers.target;
  const project = join(root, name);

  const create = await createProject(root, name, answers);

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

  await verifyLintOutput(answers.packageManager, project);
};
