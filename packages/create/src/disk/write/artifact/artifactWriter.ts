import { chmod } from 'node:fs/promises';
import { join } from 'node:path';

import { type Artifact } from '@emitters';

import { shippedAssetsReader } from '../../read/shipped-assets/shippedAssetsReader';
import {
  entryExists,
  exists,
  readIfPresent,
} from '../../utils/fsUtils';
import { safeProjectPath } from '../../utils/pathUtils';

import { projectFileWriter } from './utils/projectFileUtils';

export const artifactWriter = async (
  cwd: string,
  artifact: Artifact,
  seed = false,
): Promise<boolean> => {
  if (artifact.seed === true && !seed) {
    return false;
  }

  // Skipped rather than failed: the example is worth losing when a rearranged starter moved it.
  if (artifact.requires !== undefined
    && !(await Promise.all(artifact.requires
      .map(async (path) => {
        return await exists(join(cwd, path));
      }))).every(Boolean)) {
    return false;
  }

  const path = await safeProjectPath(cwd, artifact.target);

  if (artifact.preserve === true && await entryExists(path)) {
    return false;
  }

  // Read for every artifact: the copied checker still carries the project's own blocks.
  const current = await readIfPresent(path);

  await projectFileWriter(cwd, artifact.target, await shippedAssetsReader(artifact.content, current));

  if (artifact.executable === true) {
    // Husky and Claude Code invoke these directly, and npm does not preserve the mode bit for every consumer.
    await chmod(path, 0o755);
  }

  return true;
};
