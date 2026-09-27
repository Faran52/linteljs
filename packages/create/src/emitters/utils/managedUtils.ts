import type { Artifact } from '@config/types';

// A preserved or merged artifact is never safe to delete; the removable merges exist because a host was chosen.
export const removableIn = (artifacts: Artifact[]): string[] => {
  return artifacts
    .filter((artifact) => {
      const owned = !('merge' in artifact.content) || artifact.removable === true;

      return artifact.preserve !== true && owned;
    })
    .map((artifact) => {
      return artifact.target;
    });
};

// Kept in version control, so a bare `.sort()` would churn every consumer's next `sync`.
export const managedRecord = (removable: string[]): string => {
  return `${JSON.stringify({
    removable: [...removable]
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      }),
  }, null, 2)}\n`;
};
