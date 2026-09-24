import { chmod } from 'node:fs/promises';
import { join } from 'node:path';

import { type Artifact } from '#emitters';

import { shippedAssetsReader } from '../../read/shipped-assets/shippedAssetsReader';
import {
  entryExists,
  exists,
  readIfPresent,
} from '../../utils/fsUtils';
import { safeProjectPath } from '../../utils/pathUtils';
import { projectFileWriter } from '../project-file/projectFileWriter';

// `seed` says the project is being born, so its seed artifacts are planted. A `preserve` file that already exists is
// the project's on every run, born or not.
export const artifactWriter = async (
  cwd: string,
  artifact: Artifact,
  seed = false,
): Promise<boolean> => {
  if (artifact.seed === true && !seed) {
    return false;
  }

  // Skipped rather than failed: the example it covers is worth losing when a rearranged starter moved it.
  if (artifact.requires !== undefined
    && !(await Promise.all(artifact.requires.map(async (path) => {
      return await exists(join(cwd, path));
    }))).every(Boolean)) {
    return false;
  }

  const path = await safeProjectPath(cwd, artifact.target);

  if (artifact.preserve === true && await entryExists(path)) {
    return false;
  }

  // A transform too: the checker is copied and still carries the project's own blocks.
  const reads = 'merge' in artifact.content || 'transform' in artifact.content;
  const current = reads ? await readIfPresent(path) : null;

  await projectFileWriter(cwd, artifact.target, await shippedAssetsReader(artifact.content, current));

  if (artifact.executable === true) {
    // Husky and Claude Code invoke these directly, and npm does not preserve the mode bit for every consumer.
    await chmod(path, 0o755);
  }

  return true;
};
