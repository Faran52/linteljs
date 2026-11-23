import { readdirSync, readFileSync } from 'node:fs';
import {
  dirname,
  join,
  relative,
} from 'node:path';

import { SHELLS_DIR, SOURCES_DIR } from '../constants.ts';

// Every file under `shells/`, by its path there.
export const shippedPaths = (): string[] => {
  return readdirSync(SHELLS_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);

      return relative(SHELLS_DIR, path);
    });
};

// The names beside a base under `codegen/compose-sources/`.
export const namesBeside = (base: string): string[] => {
  const path = join(SOURCES_DIR, base);
  const folder = dirname(path);

  return readdirSync(folder);
};

export const readSource = (name: string): string => {
  const path = join(SOURCES_DIR, name);

  return readFileSync(path, 'utf8');
};
