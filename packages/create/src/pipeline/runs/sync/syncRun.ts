import {
  basename,
  dirname,
  join,
  posix,
} from 'node:path';

import { uniq } from 'es-toolkit';

import {
  ESLINT_CONFIG_PATH,
  MANAGED_PATH,
  PLUGIN_ROOT,
} from '@config/constants';

import { keysOf } from '@utils/objectUtils';

import {
  artifactWriter,
  entryExists,
  globPaths,
  managedPathsReader,
  projectShapeReader,
  readIfPresent,
  rename,
  rm,
  rmdirIfEmpty,
  safeProjectPath,
  shippedAssetsReader,
} from '@disk';
import {
  type Artifact,
  buildArtifacts,
  type DependencyDrift,
  dependencyDrift,
  emitEslintConfig,
  parsePackageJson,
  serializedPackageJson,
  TEST_RUNNERS,
  testRunnerOf,
  type Upgrade,
  upgradedPackageJson,
} from '@emitters';

import {
  APP_MANIFESTS,
  CLAUDE_SETTINGS_PATH,
  ESLINT_CONFIG_SPELLINGS,
  RENAMED_STATUS_LINES,
} from './constants';

import type { HostedAnswers, TestRunner } from '@config/types';

interface LintConfigSettled {
  status: 'missing' | 'unchanged';
}

interface LintConfigChanged {
  status: 'changed';
  path: string;
  backup: string;
}

export type LintConfigPlan = LintConfigSettled | LintConfigChanged;

export interface SyncPlan extends DependencyDrift {
  eslintConfig: LintConfigPlan;
}

export interface RunnerSwitch {
  from: TestRunner;
  to: TestRunner;
}

export interface SyncResult {
  written: string[];
  removed: string[];
}

// A recorded path is the project's to edit: one that leaves the folder, or names a directory, is never deleted.
const isPluginPath = (target: string): boolean => {
  return target.startsWith(PLUGIN_ROOT) && !target.endsWith('/') && posix.normalize(target) === target;
};

// Found rather than named, so a monorepo cloned under another directory name still syncs its app.
export const appRootOf = (cwd: string, answers: HostedAnswers): string => {
  if (answers.layout === 'single') {
    return cwd;
  }

  const [manifest] = globPaths(cwd, APP_MANIFESTS);

  if (manifest === undefined) {
    return cwd;
  }

  const app = dirname(manifest);

  return join(cwd, app);
};

const packageJsonPath = (cwd: string): string => {
  return join(cwd, 'package.json');
};

// The suites, setup and scripts a runner reads are the project's: a sync switching runners would strand them.
export const runnerSwitch = async (cwd: string, answers: HostedAnswers): Promise<RunnerSwitch | null> => {
  const to = testRunnerOf(answers);
  const manifest = await readIfPresent(packageJsonPath(cwd));

  if (to === undefined || manifest === null) {
    return null;
  }

  const devDependencies = parsePackageJson(manifest).devDependencies ?? {};

  // Each runner's package carries the runner's name.
  const isInstalled = (runner: TestRunner): boolean => {
    return Object.hasOwn(devDependencies, runner);
  };

  const from = keysOf(TEST_RUNNERS)
    .find(isInstalled);

  if (from === undefined || isInstalled(to)) {
    return null;
  }

  const found: RunnerSwitch = {
    from,
    to,
  };

  return found;
};

const driftOf = async (cwd: string, answers: HostedAnswers): Promise<DependencyDrift> => {
  const manifest = await readIfPresent(packageJsonPath(cwd));

  if (manifest === null) {
    const noDrift: DependencyDrift = {
      upgrades: [],
      peers: [],
    };

    return noDrift;
  }

  const existing = parsePackageJson(manifest);

  return dependencyDrift(existing, answers);
};

// Never over an earlier backup: `.bak`, then `.bak.1`, `.bak.2` and so on.
const freeBackup = async (cwd: string, path: string, index = 0): Promise<string> => {
  const backup = index === 0 ? `${path}.bak` : `${path}.bak.${String(index)}`;
  const isTaken = await entryExists(join(cwd, backup));

  return isTaken ? await freeBackup(cwd, path, index + 1) : backup;
};

const lintConfigPlan = async (cwd: string, answers: HostedAnswers): Promise<LintConfigPlan> => {
  const unchanged: LintConfigSettled = { status: 'unchanged' };
  const missing: LintConfigSettled = { status: 'missing' };
  const emitted = emitEslintConfig(answers);

  for (const path of ESLINT_CONFIG_SPELLINGS) {
    const current = await readIfPresent(join(cwd, path));

    if (current === null) {
      continue;
    }

    if (path === ESLINT_CONFIG_PATH && current === emitted) {
      return unchanged;
    }

    const backup = await freeBackup(cwd, path);
    const changed: LintConfigChanged = {
      status: 'changed',
      path,
      backup,
    };

    return changed;
  }

  return missing;
};

export const planSync = async (cwd: string, answers: HostedAnswers): Promise<SyncPlan> => {
  const drift = await driftOf(cwd, answers);
  const eslintConfig = await lintConfigPlan(cwd, answers);
  const plan: SyncPlan = {
    ...drift,
    eslintConfig,
  };

  return plan;
};

// An empty `.claude-plugin/` reads as if the host were still configured.
const pruneEmpty = async (cwd: string, removed: string[]): Promise<void> => {
  const directories = uniq(removed
    .flatMap((target) => {
      const parts = target
        .split('/')
        .slice(0, -1);

      return parts
        .map((_, index) => {
          return parts
            .slice(0, index + 1)
            .join('/');
        });
    }));

  // A child path is always longer than its parent, so length descending is depth-first.
  const deepestFirst = directories
    .toSorted((left, right) => {
      return right.length - left.length;
    });

  for (const directory of deepestFirst) {
    await rmdirIfEmpty(join(cwd, directory));
  }
};

const pluginArtifacts = async (cwd: string, answers: HostedAnswers): Promise<Artifact[]> => {
  const project = await projectShapeReader(appRootOf(cwd, answers));
  const built = buildArtifacts(answers, project, basename(cwd));

  return built
    .filter(({ target }) => {
      return target.startsWith(PLUGIN_ROOT);
    });
};

const migrateStatusLines = async (cwd: string): Promise<boolean> => {
  const current = await readIfPresent(join(cwd, CLAUDE_SETTINGS_PATH));

  if (current === null) {
    return false;
  }

  const text = RENAMED_STATUS_LINES
    .reduce((settings, [from, to]) => {
      return settings.replaceAll(from, to);
    }, current);

  if (text === current) {
    return false;
  }

  const artifact: Omit<Artifact, 'stage'> = {
    target: CLAUDE_SETTINGS_PATH,
    content: { text },
  };

  return await artifactWriter(cwd, artifact);
};

// The folder is linteljs's whole, so it is written without asking.
export const syncPlugin = async (cwd: string, answers: HostedAnswers): Promise<SyncResult> => {
  const written: string[] = [];
  const removed: string[] = [];

  // Read first: the loop below rewrites the record.
  const recorded = await managedPathsReader(cwd);
  const artifacts = await pluginArtifacts(cwd, answers);
  const expected = new Set(artifacts
    .map(({ target }) => {
      return target;
    }));

  for (const artifact of artifacts) {
    const path = await safeProjectPath(cwd, artifact.target);
    const current = await readIfPresent(path);
    const shipped = await shippedAssetsReader(artifact.content, current);

    if (current === shipped) {
      continue;
    }

    const isWritten = await artifactWriter(cwd, artifact);

    // The record is this run's own bookkeeping, not a file to report.
    if (isWritten && artifact.target !== MANAGED_PATH) {
      written.push(artifact.target);
    }
  }

  for (const target of recorded) {
    if (expected.has(target) || !isPluginPath(target)) {
      continue;
    }

    const path = await safeProjectPath(cwd, target);
    const isPresent = await entryExists(path);

    if (!isPresent) {
      continue;
    }

    // On a symlink this drops the link, not its target.
    await rm(path);
    removed.push(target);
  }

  await pruneEmpty(cwd, removed);

  const isMigrated = await migrateStatusLines(cwd);

  if (isMigrated) {
    written.push(CLAUDE_SETTINGS_PATH);
  }

  const result: SyncResult = {
    written,
    removed,
  };

  return result;
};

// Only the named entries move; every other byte of the manifest is the project's.
export const writeDependencies = async (cwd: string, changes: Upgrade[]): Promise<void> => {
  const manifest = await readIfPresent(packageJsonPath(cwd));
  const upgraded = upgradedPackageJson(parsePackageJson(manifest ?? '{}'), changes);
  const artifact: Omit<Artifact, 'stage'> = {
    target: 'package.json',
    content: { text: serializedPackageJson(upgraded) },
  };

  await artifactWriter(cwd, artifact);
};

export const writeLintConfig = async (cwd: string, answers: HostedAnswers, plan: LintConfigPlan): Promise<void> => {
  if (plan.status === 'changed') {
    const from = await safeProjectPath(cwd, plan.path);
    const to = await safeProjectPath(cwd, plan.backup);

    await rename(from, to);
  }

  const artifact: Omit<Artifact, 'stage'> = {
    target: ESLINT_CONFIG_PATH,
    content: { text: emitEslintConfig(answers) },
  };

  await artifactWriter(cwd, artifact);
};
