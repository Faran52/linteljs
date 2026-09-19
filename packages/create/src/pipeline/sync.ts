import { dirname, join } from 'node:path';

import { LEGACY_CONFIG_PATH } from '../answers/linteljsConfig';
import { MANAGED_PATH } from '../config/managed';
import { buildArtifacts } from '../emitters';
import { applyArtifact, safeProjectPath } from '../files/projectFiles';
import { readManagedPaths } from '../files/readManagedPaths';
import { readProjectShape } from '../files/readProjectShape';
import { contentOf } from '../files/shippedAssets';
import {
  entryExists,
  readIfPresent,
  rm,
  rmdir,
} from '../files/utils/fsUtils';
import { git } from '../process/git';

import type { Answers } from '../answers/answers';

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

// Re-applies shipped artifacts from the installed CLI, diffing first rather than rewriting blind.

// What the last run recorded as its own, plus the one name no run writes any more: versions through 1.6.0 kept the
// answers in `lintel.config.json`, so an upgraded project carries a file this one replaced.
const obsoleteCandidates = async (cwd: string): Promise<readonly string[]> => {
  return [...await readManagedPaths(cwd), LEGACY_CONFIG_PATH];
};

// `git diff --no-index` rather than a diff dependency; `git.ts` says why that is safe.
const diffOf = (currentPath: string, shipped: string, cwd: string): string => {
  const result = git(
    ['diff', '--no-index', '--no-color', '--', currentPath, '-'],
    {
      cwd,
      input: shipped,
    },
  );

  // Without git, the status is reported with no diff rather than failing sync.
  return result.error === undefined ? result.stdout : '';
};

// A closed list of exact paths, so dropping a deselected host's files reaches nothing the project put beside them.
const obsoleteIn = async (cwd: string, expected: Set<string>): Promise<SyncEntry[]> => {
  const entries: SyncEntry[] = [];

  for (const target of await obsoleteCandidates(cwd)) {
    if (!expected.has(target) && await entryExists(join(cwd, target))) {
      entries.push({
        target,
        status: 'obsolete',
        diff: '',
      });
    }
  }

  return entries;
};

export const planSync = async (cwd: string, answers: Answers): Promise<SyncPlan> => {
  const entries: SyncEntry[] = [];
  const expected = new Set<string>();

  const project = await readProjectShape(cwd);

  for (const artifact of buildArtifacts(answers, project)) {
    expected.add(artifact.target);

    // This run's own bookkeeping, rewritten whenever it applies anything, so it is not a file to report or choose.
    if (artifact.target === MANAGED_PATH) {
      continue;
    }

    const path = join(cwd, artifact.target);
    const current = await readIfPresent(path);

    if (current === null) {
      entries.push({
        target: artifact.target,
        status: 'missing',
        diff: '',
      });
      continue;
    }

    // Reporting an edit here would invite a `--force` that undoes it.
    if (artifact.preserve === true) {
      entries.push({
        target: artifact.target,
        status: 'unchanged',
        diff: '',
      });
      continue;
    }

    const shipped = await contentOf(artifact.content, current);

    entries.push(
      current === shipped
        ? {
            target: artifact.target,
            status: 'unchanged',
            diff: '',
          }
        : {
            target: artifact.target,
            status: 'changed',
            diff: diffOf(artifact.target, shipped, cwd),
          },
    );
  }

  entries.push(...await obsoleteIn(cwd, expected));

  return {
    entries,
    pending: entries.filter((entry) => {
      return entry.status !== 'unchanged';
    }),
  };
};

// An empty `.claude/` reads as if the host were still configured.
const pruneEmpty = async (cwd: string, removed: string[]): Promise<void> => {
  const directories = new Set<string>();

  for (const target of removed) {
    let directory = dirname(target);

    while (directory !== '.') {
      directories.add(directory);
      directory = dirname(directory);
    }
  }

  // A child path is always longer than its parent, so length descending is depth-first.
  const deepestFirst = [...directories].sort((left, right) => {
    return right.length - left.length;
  });

  for (const directory of deepestFirst) {
    try {
      await rmdir(join(cwd, directory));
    }
    catch {
    }
  }
};

export const applySync = async (
  cwd: string,
  answers: Answers,
  targets: string[],
): Promise<SyncResult> => {
  const written: string[] = [];
  const removed: string[] = [];
  const expected = new Set<string>();

  const project = await readProjectShape(cwd);
  // Read before anything is applied: the loop below rewrites the record, and what may be removed is what the
  // previous run recorded rather than what this one is about to.
  const candidates = await obsoleteCandidates(cwd);

  for (const artifact of buildArtifacts(answers, project)) {
    expected.add(artifact.target);

    // Rewritten whenever this run applies anything, and never reported: it is bookkeeping, not a file the caller
    // asked for, and a partial sync that left it stale would forget what it may remove next time.
    if (artifact.target === MANAGED_PATH) {
      await applyArtifact(cwd, artifact);
      continue;
    }

    if (!targets.includes(artifact.target)) {
      continue;
    }

    if (await applyArtifact(cwd, artifact)) {
      written.push(artifact.target);
    }
  }

  for (const target of candidates) {
    if (expected.has(target) || !targets.includes(target)) {
      continue;
    }

    // On a symlink this drops the link, not its target.
    await rm(await safeProjectPath(cwd, target), { force: true });
    removed.push(target);
  }

  await pruneEmpty(cwd, removed);

  return {
    written,
    removed,
  };
};
