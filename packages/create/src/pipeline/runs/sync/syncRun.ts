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
import { buildArtifacts } from '@emitters';
import { gitSpawn } from '@spawns';

import type { HostedAnswers } from '@config/types';

export type SyncStatus = 'unchanged' | 'changed' | 'missing' | 'obsolete';

export interface SyncEntry {
  target: string;
  status: SyncStatus;
  diff: string;
}

export interface SyncPlan {
  entries: SyncEntry[];
  pending: SyncEntry[];
}

export interface SyncResult {
  written: string[];
  removed: string[];
}

const entryOf = (target: string, status: SyncStatus, diff = ''): SyncEntry => {
  return {
    target,
    status,
    diff,
  };
};

// Versions through 1.5.3 kept the answers in `lintel.config.json`.
const obsoleteCandidates = async (cwd: string): Promise<readonly string[]> => {
  return [...await managedPathsReader(cwd), LEGACY_CONFIG_PATH];
};

// `git diff --no-index` rather than a diff dependency.
const diffOf = (currentPath: string, shipped: string, cwd: string): string => {
  const result = gitSpawn(
    [
      'diff',
      '--no-index',
      '--no-color',
      '--',
      currentPath,
      '-',
    ],
    {
      cwd,
      input: shipped,
    },
  );

  // Without git, or past spawnSync's buffer, the status is reported with no diff.
  return 'stdout' in result && result.error === undefined ? result.stdout : '';
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

  const project = await projectShapeReader(cwd);

  for (const artifact of buildArtifacts(answers, project, basename(cwd))) {
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

    // Reporting an edit here would invite a `--force` that undoes it.
    if (artifact.preserve === true) {
      entries.push(entryOf(artifact.target, 'unchanged'));
      continue;
    }

    const shipped = await shippedAssetsReader(artifact.content, current);

    entries.push(current === shipped
      ? entryOf(artifact.target, 'unchanged')
      : entryOf(artifact.target, 'changed', diffOf(artifact.target, shipped, cwd)));
  }

  entries.push(...await obsoleteIn(cwd, expected));

  return {
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

  const project = await projectShapeReader(cwd);
  // Read first: the loop below rewrites the record.
  const candidates = await obsoleteCandidates(cwd);

  for (const artifact of buildArtifacts(answers, project, basename(cwd))) {
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
