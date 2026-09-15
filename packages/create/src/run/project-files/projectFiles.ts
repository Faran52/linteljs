import { constants } from 'node:fs';
import {
  chmod,
  lstat,
  mkdir,
  open,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';

import { type Artifact } from '../../artifacts';
import { contentOf } from '../shipped-assets/shippedAssets';
import {
  entryExists,
  isAbsence,
  readIfPresent,
} from '../utils/fsUtils';

export const safeProjectPath = async (cwd: string, target: string): Promise<string> => {
  const root = resolve(cwd);
  const path = resolve(root, target);
  const relativePath = relative(root, path);

  if (
    isAbsolute(target)
    || relativePath === ''
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
  ) {
    throw new Error(`Refusing to use ${target}: target must be a relative path inside the project`);
  }

  let parent = root;

  for (const segment of dirname(relativePath).split(sep)) {
    if (segment === '.') {
      continue;
    }

    parent = join(parent, segment);

    try {
      if ((await lstat(parent)).isSymbolicLink()) {
        throw new Error(`Refusing to use ${target}: a parent directory is a symbolic link`);
      }
    }
    catch (error) {
      if (isAbsence(error)) {
        break;
      }

      throw error;
    }
  }

  return path;
};

export const writeProjectFile = async (
  cwd: string,
  target: string,
  text: string,
): Promise<void> => {
  const path = await safeProjectPath(cwd, target);

  await mkdir(dirname(path), { recursive: true });
  // Walked again: the first walk stopped at the first parent that did not exist yet. Called for the refusal.
  await safeProjectPath(cwd, target);

  try {
    // Never a symbolic link and whatever it points at.
    const file = await open(
      path,
      constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
      0o666,
    );

    try {
      await file.writeFile(text, 'utf8');
    }
    finally {
      await file.close();
    }
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ELOOP') {
      throw new Error(`Refusing to write ${target}: target is a symbolic link`);
    }

    throw error;
  }
};

// `fresh` decides whether an existing `preserve` file is the project's or a scaffolder's default: a scaffolder
// writes its own `vite.config.ts` moments before this runs.
export const applyArtifact = async (
  cwd: string,
  artifact: Artifact,
  fresh = false,
): Promise<boolean> => {
  const path = await safeProjectPath(cwd, artifact.target);

  if (!fresh && artifact.preserve === true && await entryExists(path)) {
    return false;
  }

  // A transform too: the checker is copied and still carries the project's own blocks.
  const reads = 'merge' in artifact.content || 'transform' in artifact.content;
  const current = reads ? await readIfPresent(path) : null;

  await writeProjectFile(cwd, artifact.target, await contentOf(artifact.content, current));

  if (artifact.executable === true) {
    // Husky and Claude Code invoke these directly, and npm does not preserve the mode bit for every consumer.
    await chmod(path, 0o755);
  }

  return true;
};
