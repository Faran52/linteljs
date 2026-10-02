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
  if (artifact.requires !== undefined) {
    const present = await Promise.all(artifact.requires
      .map(async (path) => {
        return await exists(join(cwd, path));
      }));

    if (!present.every(Boolean)) {
      return false;
    }
  }

  const path = await safeProjectPath(cwd, artifact.target);

  const isPreserved = artifact.preserve === true && await entryExists(path);

  if (isPreserved) {
    return false;
  }

  // Read for every artifact: the copied checker still carries the project's own blocks.
  const current = await readIfPresent(path);

  const text = await shippedAssetsReader(artifact.content, current);

  await projectFileWriter(cwd, artifact.target, text);

  if (artifact.executable === true) {
    // Husky and Claude Code invoke these directly, and npm does not preserve the mode bit for every consumer.
    await chmod(path, 0o755);
  }

  return true;
};
