import { readdirSync, readFileSync } from 'node:fs';
import {
  dirname,
  join,
  relative,
} from 'node:path';

import {
  type Subject,
  subjectVariants,
  type Variant,
} from '../src/shipped/utils/variantUtils';

// The sibling package's tree by relative path, which Stryker's sandbox keeps through the `create` link it plants.
const TEMPLATES = join(import.meta.dirname, '../../create/templates');

const SOURCES = join(TEMPLATES, 'codegen/compose-sources');

const SHELLS = join(TEMPLATES, 'shells');

const SHIPPED = readdirSync(SHELLS, { recursive: true, withFileTypes: true })
  .filter((entry) => {
    return entry.isFile();
  })
  .map((entry) => {
    const path = join(entry.parentPath, entry.name);

    return relative(SHELLS, path);
  });

export const readSource = (name: string): string => {
  const path = join(SOURCES, name);

  return readFileSync(path, 'utf8');
};

export const readShipped = (name: string): string => {
  const path = join(SHELLS, name);

  return readFileSync(path, 'utf8');
};

export const shippedVariants = (subject: Subject): Variant[] => {
  const base = join(SOURCES, subject.base);
  const folder = dirname(base);
  const sourceNames = readdirSync(folder);

  return subjectVariants(subject, SHIPPED, sourceNames);
};
