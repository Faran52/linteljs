import type { Artifact } from '@config/types';

/**
 * Only what linteljs owns outright. A preserved artifact is the project's from the moment it has one, and a merge
 * carries the project's own lines beside linteljs's, so neither is ever safe to delete. `.claude/settings.json` is
 * the one merge that says otherwise: the whole file exists because a host was selected.
 */
export const removableIn = (artifacts: Artifact[]): string[] => {
  return artifacts.filter((artifact) => {
    const owned = !('merge' in artifact.content) || artifact.removable === true;

    return artifact.preserve !== true && owned;
  }).map((artifact) => {
    return artifact.target;
  });
};

export const managedRecord = (removable: string[]): string => {
  return `${JSON.stringify({
    removable: [...removable].toSorted((left, right) => {
      return left.localeCompare(right);
    }),
  }, null, 2)}\n`;
};
