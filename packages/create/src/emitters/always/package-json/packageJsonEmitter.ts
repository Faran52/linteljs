import {
  MANAGER_FLOORS,
  NODE_FLOOR,
} from '@config/constants';
import {
  type Answers,
  type Artifact,
  type ProjectShape,
} from '@config/types';

import { targetFor } from '@targets';

import { merged } from '../../utils/artifactUtils';
import {
  allowedBuildNames,
  buildDependencies,
  buildDevDependencies,
  buildOverrides,
  dependencyDrift,
  type PackageJson,
  parsePackageJson,
  upgradedPackageJson,
} from '../../utils/packageJsonUtils';
import { buildScripts } from '../utils/scriptUtils';

import { SUPERSEDED } from './constants';

// Patches rather than writes: the scaffolder's dependencies, name and scripts survive.

const withoutSuperseded = (dependencies: Record<string, string>): Record<string, string> => {
  const kept = Object.entries(dependencies)
    .filter(([name]) => {
      return !SUPERSEDED.includes(name);
    });

  return Object.fromEntries(
    kept,
  );
};

export const patchPackageJson = (existing: PackageJson, answers: Answers): PackageJson => {
  const target = targetFor(answers);
  const packageJson = { ...existing };

  Reflect.deleteProperty(packageJson, 'linteljs');

  const dependencies = {
    ...existing.dependencies,
    ...buildDependencies(answers),
  };
  const devDependencies = {
    ...withoutSuperseded(existing.devDependencies ?? {}),
    ...buildDevDependencies(answers),
  };
  const pm = answers.packageManager;
  const version = answers.packageManagerVersion ?? MANAGER_FLOORS[pm];
  const overrides = buildOverrides(answers);
  // pnpm reads its overrides from `pnpm-workspace.yaml`; yarn names the field `resolutions`.
  const overrideField = pm === 'npm' || pm === 'bun' ? 'overrides' : 'resolutions';
  const allowedBuilds = allowedBuildNames(answers);
  const allowedScripts = Object.fromEntries(allowedBuilds
    .map((name) => {
      const allowed: [string, boolean] = [name, true];

      return allowed;
    }));
  const patched: PackageJson = {
    ...packageJson,
    type: 'module',
    // So npm cannot publish it.
    private: true,
    ...(target.packageMain === undefined ? {} : { main: target.packageMain }),
    // A browser worker is a file the page fetches, so it sits where the dev server serves.
    ...(answers.mocking === 'msw' && target.publicDirectory !== undefined
      ? { msw: { workerDirectory: [target.publicDirectory] } }
      : {}),
    // No bun field: neither corepack nor pnpm's switch knows bun.
    ...(pm === 'bun' ? {} : { packageManager: `${pm}@${version}` }),
    engines: {
      node: `>=${NODE_FLOOR}`,
      // The floor, which is what was tested; the exact version is in `packageManager`.
      [pm]: `>=${MANAGER_FLOORS[pm]}`,
    },
    devEngines: {
      // Spread first, so a scaffolder's own `runtime` entry survives.
      ...existing.devEngines,
      packageManager: {
        name: pm,
        onFail: 'error',
      },
    },
    scripts: {
      ...existing.scripts,
      ...buildScripts(answers),
    },
    // Never empty: `qs` is read by `http.ts`, which every project receives.
    dependencies,
    devDependencies,
    ...(Object.keys(overrides).length === 0 || pm === 'pnpm'
      ? {}
      : {
          [overrideField]: {
            ...existing[overrideField],
            ...overrides,
          },
        }),
    // bun blocks every install script it has not been told about, and reads the list from here.
    ...(answers.packageManager === 'bun' ? { trustedDependencies: allowedBuilds } : {}),
    // npm 12 blocks every unlisted install script and reads the list from here, not `.npmrc`.
    ...(answers.packageManager === 'npm'
      ? {
          allowScripts: {
            ...existing.allowScripts,
            ...allowedScripts,
          },
        }
      : {}),
  };

  return patched;
};

const serialized = (packageJson: PackageJson): string => {
  return `${JSON.stringify(packageJson, null, 2)}\n`;
};

// `sync` moves only the `@linteljs/*` versions: the framework and everything else stay the project's.
export const resyncPackageJson = (current: string, answers: Answers): string => {
  const existing = parsePackageJson(current);
  const { upgrades } = dependencyDrift(existing, answers);

  if (upgrades.length === 0) {
    return current;
  }

  const upgraded = upgradedPackageJson(existing, upgrades);

  return serialized(upgraded);
};

// Merged: two of three migrations had to add dependencies their answers already implied.
export const packageJsonEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  const merge = (current: string | null): string => {
    const manifest: PackageJson = current === null ? { name } : parsePackageJson(current);
    const patched = patchPackageJson(manifest, answers);

    return serialized(patched);
  };

  const resync = (current: string): string => {
    return resyncPackageJson(current, answers);
  };

  const artifacts = [merged('package', 'package.json', merge, resync)];

  return artifacts;
};
