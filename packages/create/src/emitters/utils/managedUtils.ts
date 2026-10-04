import { PLUGIN_ROOT } from '@config/constants';

import type { Artifact } from '@config/types';

// Only the plugin tree: `sync` deletes nowhere else.
export const removableIn = (artifacts: Artifact[]): string[] => {
  return artifacts
    .map((artifact) => {
      return artifact.target;
    })
    .filter((target) => {
      return target.startsWith(PLUGIN_ROOT);
    });
};

// Kept in version control, so a bare `.sort()` would churn every consumer's next `sync`.
export const managedRecord = (removable: string[]): string => {
  return `${JSON.stringify({
    removable: removable
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      }),
  }, null, 2)}\n`;
};
