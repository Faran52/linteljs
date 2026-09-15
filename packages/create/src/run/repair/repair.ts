import {
  readFile,
  rename,
  rm,
} from 'node:fs/promises';
import { basename, join } from 'node:path';

import { targetFor } from '../../model/targets';
import { safeProjectPath, writeProjectFile } from '../project-files/projectFiles';
import { SOURCE_ROOT, sourceFiles } from '../rewrite/rewrite';
import { entryExists, isAbsence } from '../utils/fsUtils';

import type { Answers } from '../../model/answers/answers';
import type { StarterRename } from '../../model/targets';

// Fresh projects only; exact generator text turns upstream drift into a notice.
const applyStarterFixes = async (
  cwd: string,
  answers: Answers,
  onWrite?: (path: string) => void,
  onNotice?: (message: string) => void,
): Promise<void> => {
  for (const {
    path,
    transform,
    moveTo,
  } of targetFor(answers).starterFixes ?? []) {
    const full = await safeProjectPath(cwd, path);
    let before = '';

    try {
      before = await readFile(full, 'utf8');
    }
    catch (error) {
      if (isAbsence(error)) {
        continue;
      }

      throw error;
    }

    const after = transform === undefined ? before : transform(before);

    if (moveTo !== undefined) {
      await writeProjectFile(cwd, moveTo, after);
      await rm(full);
      onWrite?.(moveTo);
      continue;
    }

    if (after === before) {
      onNotice?.(`  starter fix for ${path} matched nothing: the generator changed what it writes.`);
      continue;
    }

    await writeProjectFile(cwd, path, after);
    onWrite?.(path);
  }
};

// Script extensions only, so `x.module.css` keeps its name.
const specifierFor = (path: string): string => {
  return path.replace(/\.[cm]?tsx?$/, '');
};

// Longest first, so a rename never matches part of a longer path.
const specifierEdits = (renames: StarterRename[]): [string, string][] => {
  return renames.map(({ from, to }): [string, string] => {
    return [`/${basename(specifierFor(from))}`, `/${basename(specifierFor(to))}`];
  }).sort(([left], [right]) => {
    return right.length - left.length;
  });
};

const repointSpecifiers = (source: string, edits: [string, string][]): string => {
  return edits.reduce((text, [from, to]) => {
    // The closing quote is included so a longer filename's stem is not rewritten.
    return text.replaceAll(`${from}'`, `${to}'`).replaceAll(`${from}"`, `${to}"`);
  }, source);
};

// After the starter fixes, which match original paths; `rename` handles case-only APFS moves.
const renameStarterFiles = async (
  cwd: string,
  answers: Answers,
  onWrite?: (path: string) => void,
  onNotice?: (message: string) => void,
): Promise<void> => {
  const moved: StarterRename[] = [];

  for (const entry of targetFor(answers).starterRenames ?? []) {
    const from = await safeProjectPath(cwd, entry.from);
    const present = await entryExists(from);

    if (!present) {
      // Warned, not thrown: a generator that moved its own file is not a reason to fail.
      onNotice?.(`  starter rename for ${entry.from} found nothing: the generator changed what it writes.`);
      continue;
    }

    // Always a write, since the destination changed rather than the text.
    await rename(from, await safeProjectPath(cwd, entry.to));
    moved.push(entry);
    onWrite?.(entry.to);
  }

  if (moved.length === 0) {
    return;
  }

  const edits = specifierEdits(moved);

  for (const path of await sourceFiles(join(cwd, SOURCE_ROOT))) {
    const before = await readFile(path, 'utf8');
    const after = repointSpecifiers(before, edits);

    if (after !== before) {
      const target = path.slice(cwd.length + 1);

      await writeProjectFile(cwd, target, after);
      onWrite?.(target);
    }
  }
};

// Removes what lintel's own files orphaned, per `staleScaffoldFiles`.
const removeStaleScaffoldFiles = async (
  cwd: string,
  answers: Answers,
  onNotice?: (message: string) => void,
): Promise<void> => {
  for (const path of targetFor(answers).staleScaffoldFiles ?? []) {
    const full = await safeProjectPath(cwd, path);
    const present = await entryExists(full);

    if (!present) {
      continue;
    }

    await rm(full);
    // A delete the user did not ask for has to appear in the log.
    onNotice?.(`removed ${path}, which nothing references now`);
  }
};

export const repairScaffoldedOutput = async (
  cwd: string,
  answers: Answers,
  onWrite?: (path: string) => void,
  onNotice?: (message: string) => void,
): Promise<void> => {
  await applyStarterFixes(cwd, answers, onWrite, onNotice);
  await renameStarterFiles(cwd, answers, onWrite, onNotice);
  await removeStaleScaffoldFiles(cwd, answers, onNotice);
};
