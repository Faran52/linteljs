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
  // Filtered before the merge: a package this target names is not one the scaffolder left behind.
  const devDependencies = {
    ...withoutSuperseded(existing.devDependencies ?? {}),
    ...buildDevDependencies(answers),
  };
  const pm = answers.packageManager;
  // What a project installs with is the command, not the id: `yarn-classic` is yarn 1 and declares itself `yarn`.
  const binary = MANAGER_BINARIES[pm];
  // The manager that invoked the CLI, or the floor where a config predates the recording of it.
  const version = answers.packageManagerVersion ?? MANAGER_FLOORS[pm];

  return {
    ...packageJson,
    type: 'module',
    /*
     * Declared rather than inherited. A generated project is an application: without it yarn 1 warns about a
     * missing license on every install and refuses workspaces, and npm would publish the thing by accident.
     */
    private: true,
    ...(target.packageMain === undefined ? {} : { main: target.packageMain }),
    /*
     * Where MSW puts `mockServiceWorker.js` on install. A browser worker is a real file the page fetches,
     * so it has to sit in whatever directory the dev server serves, and this key is how MSW is told which.
     */
    ...(answers.mocking === 'msw' && target.publicDirectory !== undefined
      ? { msw: { workerDirectory: [target.publicDirectory] } }
      : {}),
    // No bun field: neither corepack nor pnpm's switch knows bun, and `engines.bun` says what this would have.
    ...(pm === 'bun' ? {} : { packageManager: `${binary}@${version}` }),
    engines: {
      node: NODE_ENGINE,
      // The floor rather than the executor's version: the exact one is in `packageManager`, and the floor is what
      // was tested.
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
    // Never empty: `qs` is read by `http.ts`, which every project receives whatever it answered.
    dependencies,
    devDependencies,
    // bun blocks every install script it has not been told about, and reads the list from here rather than bunfig.
    ...(answers.packageManager === 'bun' ? { trustedDependencies: allowedBuildNames(answers) } : {}),
    // npm 12 blocks every install script it has not been told about and reads the list from here, not `.npmrc`.
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

/**
 * Reached through the artifact list so `sync` runs it too; `name` is consulted only when there is no `package.json`.
 * Merged for the same reason `.gitignore` is: two of three migrations had to add dependencies by hand that their
 * answers already implied.
 */
export const packageJsonEmitter = (answers: Answers, _project: ProjectShape, name: string): Artifact[] => {
  return [merged('package', 'package.json', (current) => {
    return emitPackageJson(current === null ? { name } : parsePackageJson(current), answers);
  })];
};
