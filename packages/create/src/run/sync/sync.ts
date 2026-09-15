import { rm, rmdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { buildArtifacts, GENERATED_AGENT_TARGETS } from '../../artifacts';
import { git } from '../git/git';
import { applyArtifact, safeProjectPath } from '../project-files/projectFiles';
import { readProjectShape } from '../project-shape/readProjectShape';
import { contentOf } from '../shipped-assets/shippedAssets';
import { entryExists, readIfPresent } from '../utils/fsUtils';

import type { Answers } from '../../model/answers/answers';

// Re-applies shipped artifacts from the installed CLI, diffing first rather than rewriting blind.

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

  for (const target of GENERATED_AGENT_TARGETS) {
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

  for (const artifact of buildArtifacts(answers, project)) {
    expected.add(artifact.target);

    if (!targets.includes(artifact.target)) {
      continue;
    }

    if (await applyArtifact(cwd, artifact)) {
      written.push(artifact.target);
    }
  }

  for (const target of GENERATED_AGENT_TARGETS) {
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
