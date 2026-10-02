import { basename, join } from 'node:path';

import { MANAGED_PATH } from '@config/constants';

import { CONFIG_PATH, LEGACY_CONFIG_PATH } from '@answers';
import {
  artifactWriter,
  entryExists,
  managedPathsReader,
  projectShapeReader,
  readIfPresent,
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
  linteljsConfigEmitter,
  parsePackageJson,
} from '@emitters';

import type { HostedAnswers } from '@config/types';

export type SyncStatus = 'unchanged' | 'changed' | 'missing' | 'obsolete';

export interface SyncEntry {
  target: string;
  status: SyncStatus;
}

export interface SyncPlan extends DependencyDrift {
  entries: SyncEntry[];
  pending: SyncEntry[];
}

export interface SyncResult {
  written: string[];
  removed: string[];
}

const entryOf = (target: string, status: SyncStatus): SyncEntry => {
  const entry: SyncEntry = {
    target,
    status,
  };

  return entry;
};

// Versions through 1.5.3 kept the answers in `lintel.config.json`.
const obsoleteCandidates = async (cwd: string): Promise<readonly string[]> => {
  const managedPaths = await managedPathsReader(cwd);
  const candidates = [...managedPaths, LEGACY_CONFIG_PATH];

  return candidates;
};

// Over a file the project has, a merge with a `resync` keeps what the project owns.
const forSync = (artifact: Artifact): Artifact => {
  const { content } = artifact;

  if (!('resync' in content)) {
    return artifact;
  }

  const { merge, resync = merge } = content;

  const resyncing: Artifact = {
    ...artifact,
    content: {
      merge: (current) => {
        return current === null ? merge(null) : resync(current);
      },
    },
  };

  return resyncing;
};

const hasCurrentConfig = async (cwd: string): Promise<boolean> => {
  return await entryExists(join(cwd, CONFIG_PATH));
};

// A 1.x project's answers exist only under the old name, which `sync` removes.
const migratedConfig = async (cwd: string, answers: HostedAnswers): Promise<Artifact[]> => {
  const hasLegacy = await entryExists(join(cwd, LEGACY_CONFIG_PATH));
  const isMigrating = hasLegacy && !await hasCurrentConfig(cwd);

  return isMigrating ? linteljsConfigEmitter(answers) : [];
};

const syncArtifacts = async (cwd: string, answers: HostedAnswers): Promise<Artifact[]> => {
  const project = await projectShapeReader(cwd);
  const projectName = basename(cwd);
  const migrated = await migratedConfig(cwd, answers);
  const built = buildArtifacts(answers, project, projectName)
    .map(forSync);

  return [...migrated, ...built];
};

// A package.json `sync` would write from nothing carries every dependency already.
const driftOf = async (cwd: string, answers: HostedAnswers): Promise<DependencyDrift> => {
  const manifest = await readIfPresent(join(cwd, 'package.json'));

  if (manifest === null) {
    const noDrift: DependencyDrift = {
      upgrades: [],
      missing: {
        dependencies: {},
        devDependencies: {},
      },
    };

    return noDrift;
  }

  const packageJson = parsePackageJson(manifest);

  return dependencyDrift(packageJson, answers);
};

// Exact paths, so dropping a deselected host's files reaches nothing the project put beside them.
const obsoleteIn = async (cwd: string, expected: Set<string>): Promise<SyncEntry[]> => {
  const entries: SyncEntry[] = [];

  const candidates = await obsoleteCandidates(cwd);

  for (const target of candidates) {
    const isObsolete = !expected.has(target) && await entryExists(join(cwd, target));

    if (isObsolete) {
      entries.push(entryOf(target, 'obsolete'));
    }
  }

  return entries;
};

export const planSync = async (cwd: string, answers: HostedAnswers): Promise<SyncPlan> => {
  const entries: SyncEntry[] = [];
  const expected = new Set<string>();
  const artifacts = await syncArtifacts(cwd, answers);

  for (const artifact of artifacts) {
    expected.add(artifact.target);

    // This run's own bookkeeping, not a file to report.
    if (artifact.target === MANAGED_PATH) {
      continue;
    }

    const path = join(cwd, artifact.target);
    const current = await readIfPresent(path);

    if (current === null) {
      entries.push(entryOf(artifact.target, 'missing'));
      continue;
    }

    // Reporting an edit here would invite a sync that undoes it.
    if (artifact.preserve === true) {
      entries.push(entryOf(artifact.target, 'unchanged'));
      continue;
    }

    const shipped = await shippedAssetsReader(artifact.content, current);

    entries.push(entryOf(artifact.target, current === shipped ? 'unchanged' : 'changed'));
  }

  const obsolete = await obsoleteIn(cwd, expected);

  entries.push(...obsolete);

  const drift = await driftOf(cwd, answers);
  const plan: SyncPlan = {
    ...drift,
    entries,
    pending: entries
      .filter((entry) => {
        return entry.status !== 'unchanged';
      }),
  };

  return plan;
};

// An empty `.claude/` reads as if the host were still configured.
const pruneEmpty = async (cwd: string, removed: string[]): Promise<void> => {
  const directories = new Set(removed
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
  const deepestFirst = [...directories]
    .sort((left, right) => {
      return right.length - left.length;
    });

  for (const directory of deepestFirst) {
    await rmdirIfEmpty(join(cwd, directory));
  }
};

export const applySync = async (
  cwd: string,
  answers: HostedAnswers,
  targets: string[],
): Promise<SyncResult> => {
  const written: string[] = [];
  const removed: string[] = [];
  const expected = new Set<string>();

  // Read first: the loop below rewrites the record.
  const candidates = await obsoleteCandidates(cwd);
  const artifacts = await syncArtifacts(cwd, answers);

  for (const artifact of artifacts) {
    expected.add(artifact.target);

    // A partial sync that left it stale would forget what it may remove next time.
    if (artifact.target === MANAGED_PATH) {
      await artifactWriter(cwd, artifact);
      continue;
    }

    if (!targets.includes(artifact.target)) {
      continue;
    }

    const isWritten = await artifactWriter(cwd, artifact);

    if (isWritten) {
      written.push(artifact.target);
    }
  }

  for (const target of candidates) {
    if (expected.has(target) || !targets.includes(target)) {
      continue;
    }

    // Until the current name is written, the old one holds the only copy of the answers.
    const isOnlyConfig = target === LEGACY_CONFIG_PATH && !await hasCurrentConfig(cwd);

    if (isOnlyConfig) {
      continue;
    }

    const path = await safeProjectPath(cwd, target);

    // Gone since the plan: nothing to remove or report, and its directory may be gone too.
    const isPresent = await entryExists(path);

    if (!isPresent) {
      continue;
    }

    // On a symlink this drops the link, not its target.
    await rm(path);
    removed.push(target);
  }

  await pruneEmpty(cwd, removed);

  const result: SyncResult = {
    written,
    removed,
  };

  return result;
};
