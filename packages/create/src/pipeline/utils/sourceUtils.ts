import { extname, join } from 'node:path';

import { isAbsence, readdir } from '../../disk';

// Non-compiling generator output is not a project decision.
export const SOURCE_ROOT = 'src';

const SCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

// Read by both the rewrite and the repair pass, which is what puts it here rather than beside either.
export const sourceFiles = async (root: string): Promise<string[]> => {
  try {
    const entries = await readdir(root, {
      withFileTypes: true,
      recursive: true,
    });

    return entries
      .filter((entry) => {
        return entry.isFile() && SCRIPT_EXTENSIONS.has(extname(entry.name));
      })
      .map((entry) => {
        return join(entry.parentPath, entry.name);
      });
  }
  catch (error) {
    // No `src/` is not an error under `--skip-scaffold`; other failures still are.
    if (isAbsence(error)) {
      return [];
    }

    throw error;
  }
};
