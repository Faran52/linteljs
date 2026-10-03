import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { TEMPLATES_ROOT } from '@disk';

import type { Artifact } from '@emitters';

export interface Copied {
  target: string;
  sources: string[];
  text: () => string;
}

const reads = new Map<string, string>();

const readTemplate = (source: string): string => {
  const path = join(TEMPLATES_ROOT, source);
  const known = reads.get(source) ?? readFileSync(path, 'utf8');

  reads.set(source, known);

  return known;
};

// As `shippedAssetsReader` composes a new file, with no current text.
export const copiedOf = (artifact: Artifact): Copied[] => {
  const { content } = artifact;

  if (!('sources' in content)) {
    return [];
  }

  const text = (): string => {
    const joined = content.sources
      .map(readTemplate)
      .join('\n');

    return content.transform === undefined ? joined : content.transform(joined, null);
  };

  const copied: Copied[] = [{
    target: artifact.target,
    sources: content.sources,
    text,
  }];

  return copied;
};
