import { omit } from 'es-toolkit';

import { serializedPackageJson } from '@emitters';

import { type Share, stringRecordOf } from '../../utils/shareUtils';

const sortedRecordOf = (manifest: Share, key: string): Record<string, string> => {
  const record = stringRecordOf(manifest, key);
  const entries = Object.entries(record)
    .toSorted(([left], [right]) => {
      return left.localeCompare(right);
    });

  return Object.fromEntries(entries);
};

// Scripts keep the drawers' order; dependencies sort by name; an empty section is left out.
export const packageJsonWriter = (manifest: Share): string => {
  const sections = Object.entries({
    scripts: stringRecordOf(manifest, 'scripts'),
    dependencies: sortedRecordOf(manifest, 'dependencies'),
    devDependencies: sortedRecordOf(manifest, 'devDependencies'),
  })
    .filter(([, section]) => {
      return Object.keys(section).length > 0;
    });
  const rest = omit(manifest, [
    'scripts',
    'dependencies',
    'devDependencies',
  ]);

  return serializedPackageJson({
    ...rest,
    ...Object.fromEntries(sections),
  });
};
