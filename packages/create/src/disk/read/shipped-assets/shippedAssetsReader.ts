import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ArtifactContent } from '@emitters';

// Walks up to `templates/`: this module sits at `src/disk/` in the workspace and at `dist/` once published.
const templatesRootFrom = (start: string): string => {
  let dir = start;

  while (!existsSync(join(dir, 'templates')) && dir !== dirname(dir)) {
    dir = dirname(dir);
  }

  return join(dir, 'templates');
};

export const TEMPLATES_ROOT = templatesRootFrom(dirname(fileURLToPath(import.meta.url)));

// `pipeline` writes this text and `sync` compares against it, so the two never compose differently.
export const shippedAssetsReader = async (
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
    return readFile(join(TEMPLATES_ROOT, source), 'utf8');
  }));

  const joined = parts.join('\n');

  return content.transform === undefined ? joined : content.transform(joined, current);
};
