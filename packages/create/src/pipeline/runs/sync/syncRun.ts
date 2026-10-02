import { basename, join } from 'node:path';

import { MANAGED_PATH } from '@config/constants';

import { LEGACY_CONFIG_PATH } from '@answers';
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
  return {
    target,
    status,
  };
};

// Versions through 1.5.3 kept the answers in `lintel.config.json`.
const obsoleteCandidates = async (cwd: string): Promise<readonly string[]> => {
  return [...await managedPathsReader(cwd), LEGACY_CONFIG_PATH];
};

// Over a file the project has, a merge with a `resync` keeps what the project owns.
const forSync = (artifact: Artifact): Artifact => {
  const { content } = artifact;

  if (!('resync' in content)) {
    return artifact;
  }

  const { merge, resync = merge } = content;

  return {
    ...artifact,
    content: {
      merge: (current) => {
        return current === null ? merge(null) : resync(current);
      },
    },
  };
};

const syncArtifacts = async (cwd: string, answers: HostedAnswers): Promise<Artifact[]> => {
  const project = await projectShapeReader(cwd);

  return buildArtifacts(answers, project, basename(cwd))
    .map(forSync);
};

// A package.json `sync` would write from nothing carries every dependency already.
const driftOf = async (cwd: string, answers: HostedAnswers): Promise<DependencyDrift> => {
  const manifest = await readIfPresent(join(cwd, 'package.json'));

  return manifest === null
    ? {
        upgrades: [],
        missing: {
          dependencies: {},
          devDependencies: {},
        },
      }
    : dependencyDrift(parsePackageJson(manifest), answers);
};

// Exact paths, so dropping a deselected host's files reaches nothing the project put beside them.
const obsoleteIn = async (cwd: string, expected: Set<string>): Promise<SyncEntry[]> => {
  const entries: SyncEntry[] = [];

  for (const target of await obsoleteCandidates(cwd)) {
    if (!expected.has(target) && await entryExists(join(cwd, target))) {
      entries.push(entryOf(target, 'obsolete'));
    }
  }

  return entries;
};

export const planSync = async (cwd: string, answers: HostedAnswers): Promise<SyncPlan> => {
  const entries: SyncEntry[] = [];
  const expected = new Set<string>();

  for (const artifact of await syncArtifacts(cwd, answers)) {
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

  entries.push(...await obsoleteIn(cwd, expected));

  return {
    ...await driftOf(cwd, answers),
    entries,
    pending: entries
      .filter((entry) => {
        return entry.status !== 'unchanged';
      }),
  };
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

  for (const artifact of await syncArtifacts(cwd, answers)) {
    expected.add(artifact.target);

    // A partial sync that left it stale would forget what it may remove next time.
    if (artifact.target === MANAGED_PATH) {
      await artifactWriter(cwd, artifact);
      continue;
    }

    if (!targets.includes(artifact.target)) {
      continue;
    }

    if (await artifactWriter(cwd, artifact)) {
      written.push(artifact.target);
    }
  }

  for (const target of candidates) {
    if (expected.has(target) || !targets.includes(target)) {
      continue;
    }

    const path = await safeProjectPath(cwd, target);

    // Gone since the plan: nothing to remove or report, and its directory may be gone too.
    if (!await entryExists(path)) {
      continue;
    }

    // On a symlink this drops the link, not its target.
    await rm(path);
    removed.push(target);
  }

  await pruneEmpty(cwd, removed);

  return {
    written,
    removed,
  };
};
