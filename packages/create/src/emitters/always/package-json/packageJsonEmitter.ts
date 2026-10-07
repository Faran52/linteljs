import { omit, pick } from 'es-toolkit';

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

import { HOOK_DEV_DEPENDENCIES, ROOT_FIELDS } from '../../constants';
import { merged } from '../../utils/artifactUtils';
import {
  allowedBuildNames,
  buildDependencies,
  buildDevDependencies,
  buildOverrides,
  type PackageJson,
  parsePackageJson,
  serializedPackageJson,
} from '../../utils/packageJsonUtils';
import { buildScripts } from '../utils/scriptUtils';

import { LIBRARY_FIELDS, SUPERSEDED } from './constants';

// Patches rather than writes: the scaffolder's dependencies, name and scripts survive.

// The fields only some package managers read: their overrides and their install-script allowlist.
const managerFields = (existing: PackageJson, answers: Answers): PackageJson => {
  const pm = answers.packageManager;
  const overrides = buildOverrides(answers);
  // pnpm reads its overrides from `pnpm-workspace.yaml`; yarn names the field `resolutions`.
  const overrideField = pm === 'npm' || pm === 'bun' ? 'overrides' : 'resolutions';
  const allowedBuilds = allowedBuildNames(answers);
  const allowedScripts = Object.fromEntries(allowedBuilds
    .map((name) => {
      const allowed: [string, boolean] = [name, true];

      return allowed;
    }));
  const fields: PackageJson = {
    ...(Object.keys(overrides).length === 0 || pm === 'pnpm'
      ? {}
      : {
          [overrideField]: {
            ...existing[overrideField],
            ...overrides,
          },
        }),
    // bun blocks every install script it has not been told about, and reads the list from here.
    ...(pm === 'bun' ? { trustedDependencies: allowedBuilds } : {}),
    // npm 12 blocks every unlisted install script and reads the list from here, not `.npmrc`.
    ...(pm === 'npm'
      ? {
          allowScripts: {
            ...existing.allowScripts,
            ...allowedScripts,
          },
        }
      : {}),
  };

  return fields;
};

export const patchPackageJson = (existing: PackageJson, answers: Answers): PackageJson => {
  const target = targetFor(answers);
  const packageJson = { ...existing };

  Reflect.deleteProperty(packageJson, 'linteljs');

  const dependencies = {
    ...existing.dependencies,
    ...buildDependencies(answers),
  };
  const allDevDependencies: Record<string, string> = {
    ...omit(existing.devDependencies ?? {}, SUPERSEDED),
    ...buildDevDependencies(answers),
  };
  const devDependencies = answers.layout === 'monorepo'
    ? omit(allDevDependencies, HOOK_DEV_DEPENDENCIES)
    : allDevDependencies;
  const pm = answers.packageManager;
  const version = answers.packageManagerVersion ?? MANAGER_FLOORS[pm];
  const patched: PackageJson = {
    ...packageJson,
    type: 'module',
    // So npm cannot publish it.
    private: true,
    ...(target.packageMain === undefined ? {} : { main: target.packageMain }),
    ...(target.packageImports === undefined ? {} : { imports: target.packageImports }),
    // A project's own subpaths survive.
    ...(target.libraryProject === true
      ? {
          ...LIBRARY_FIELDS,
          ...pick(existing, [
            'version',
            'types',
            'exports',
            'files',
          ]),
        }
      : {}),
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
    // Empty only on a library, which ships no `http.ts`.
    ...(Object.keys(dependencies).length === 0 ? {} : { dependencies }),
    devDependencies,
    ...managerFields(existing, answers),
  };

  return patched;
};

// Merged: a migrated project often lacks dependencies its answers imply.
export const packageJsonEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  const merge = (current: string | null): string => {
    const manifest: PackageJson = current === null ? { name } : parsePackageJson(current);
    const patched = patchPackageJson(manifest, answers);
    // The root manifest carries these: `workspace-root`.
    const app = answers.layout === 'monorepo' ? omit(patched, ROOT_FIELDS) : patched;

    return serializedPackageJson(app);
  };

  const artifacts = [merged('package', 'package.json', merge)];

  return artifacts;
};
