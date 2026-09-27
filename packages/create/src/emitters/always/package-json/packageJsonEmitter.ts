import {
  MANAGER_BINARIES,
  MANAGER_FLOORS,
  NODE_ENGINE,
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
  type PackageJson,
  parsePackageJson,
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
  // `yarn-classic` is yarn 1 and declares itself `yarn`.
  const binary = MANAGER_BINARIES[pm];
  const version = answers.packageManagerVersion ?? MANAGER_FLOORS[pm];
  const overrides = buildOverrides(answers);
  // pnpm reads its overrides from `pnpm-workspace.yaml`; yarn names the field `resolutions`.
  const overrideField = pm === 'npm' || pm === 'bun' ? 'overrides' : 'resolutions';

  return {
    ...packageJson,
    type: 'module',
    // Without it yarn 1 warns about a missing license and refuses workspaces, and npm could publish it.
    private: true,
    ...(target.packageMain === undefined ? {} : { main: target.packageMain }),
    // A browser worker is a file the page fetches, so it sits where the dev server serves.
    ...(answers.mocking === 'msw' && target.publicDirectory !== undefined
      ? { msw: { workerDirectory: [target.publicDirectory] } }
      : {}),
    // No bun field: neither corepack nor pnpm's switch knows bun.
    ...(pm === 'bun' ? {} : { packageManager: `${binary}@${version}` }),
    engines: {
      node: NODE_ENGINE,
      // The floor, which is what was tested; the exact version is in `packageManager`.
      [binary]: `>=${MANAGER_FLOORS[pm]}`,
    },
    devEngines: {
      // Spread first, so a scaffolder's own `runtime` entry survives.
      ...existing.devEngines,
      packageManager: {
        name: binary,
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
    ...(answers.packageManager === 'bun' ? { trustedDependencies: allowedBuildNames(answers) } : {}),
    // npm 12 blocks every unlisted install script and reads the list from here, not `.npmrc`.
    ...(answers.packageManager === 'npm'
      ? {
          allowScripts: {
            ...existing.allowScripts,
            ...Object.fromEntries(allowedBuildNames(answers)
              .map((name) => {
                return [name, true];
              })),
          },
        }
      : {}),
  };
};

const emitPackageJson = (existing: PackageJson, answers: Answers): string => {
  return `${JSON.stringify(patchPackageJson(existing, answers), null, 2)}\n`;
};

// Merged: two of three migrations had to add dependencies their answers already implied.
export const packageJsonEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  return [merged('package', 'package.json', (current) => {
    return emitPackageJson(current === null ? { name } : parsePackageJson(current), answers);
  })];
};
