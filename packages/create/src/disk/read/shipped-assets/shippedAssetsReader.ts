import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ArtifactContent } from '@emitters';

// Walks up to `templates/`: this module sits at `src/disk/` in the workspace and at `dist/` once published.
const templatesRootFrom = (dir: string): string => {
  const parent = dirname(dir);

  const templates = join(dir, 'templates');

  return existsSync(templates) || parent === dir ? templates : templatesRootFrom(parent);
};

const MODULE_DIRECTORY = dirname(fileURLToPath(import.meta.url));

export const TEMPLATES_ROOT = templatesRootFrom(MODULE_DIRECTORY);

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

  // One character per byte, so `artifactWriter` writes an image back unchanged.
  if ('bytes' in content) {
    return await readFile(join(TEMPLATES_ROOT, content.bytes), 'latin1');
  }

  const reads = content.sources
    .map(async (source) => {
      const bytes = await readFile(join(TEMPLATES_ROOT, source));

      return bytes.toString('utf8');
    });

  const parts = await Promise.all(reads);

  const joined = parts.join('\n');

  return content.transform === undefined ? joined : content.transform(joined, current);
};
