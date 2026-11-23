import { dirname, join } from 'node:path';

import { mapValues } from 'es-toolkit';

import { moduleCompose } from '../module/moduleCompose';

import type { Subject, Variant } from './utils/variantUtils';

// `read` takes a name under `codegen/compose-sources/`.
export const shippedCompose = (subject: Subject, variant: Variant, read: (name: string) => string): string => {
  const baseDir = dirname(subject.base);
  const base = read(subject.base);
  const options = mapValues(variant.options, (file) => {
    const name = join(baseDir, file);

    return read(name);
  });
  const modules = mapValues(subject.modules, read);

  return moduleCompose({
    base,
    options,
    modules,
    plainData: subject.plainData,
    pureCalls: subject.pureCalls,
    importGroups: subject.groups,
  });
};
