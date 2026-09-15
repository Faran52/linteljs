import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ArtifactContent } from '../../artifacts';

// Walks up to `assets/`: this module sits at `src/run/` in the workspace and at `dist/` once published.
const assetsRootFrom = (start: string): string => {
  let dir = start;

  while (!existsSync(join(dir, 'assets')) && dir !== dirname(dir)) {
    dir = dirname(dir);
  }

  return join(dir, 'assets');
};

export const ASSETS_ROOT = assetsRootFrom(dirname(fileURLToPath(import.meta.url)));

// `pipeline` writes this text and `sync` compares against it, so the two never compose differently.
export const contentOf = async (
  content: ArtifactContent,
  current: string | null = null,
): Promise<string> => {
  if ('merge' in content) {
    return content.merge(current);
  }

  if ('text' in content) {
    return content.text;
  }

  const parts = await Promise.all(content.sources.map((source) => {
    return readFile(join(ASSETS_ROOT, source), 'utf8');
  }));

  const joined = parts.join('\n');

  return content.transform === undefined ? joined : content.transform(joined, current);
};
