import type { Artifact } from '@config/types';

/**
 * Only what linteljs owns outright. A preserved artifact is the project's from the moment it has one, and a merge
 * carries the project's own lines beside linteljs's, so neither is ever safe to delete. `.claude/settings.json` and
 * `.cursor/hooks.json` are the merges that say otherwise: each file exists because a host was selected.
 */
export const removableIn = (artifacts: Artifact[]): string[] => {
  return artifacts.filter((artifact) => {
    const owned = !('merge' in artifact.content) || artifact.removable === true;

    return artifact.preserve !== true && owned;
  }).map((artifact) => {
    return artifact.target;
  });
};

/**
 * A project keeps this record in version control, so the order is part of what the CLI emits: a bare `.sort()`
 * puts `SKILL.md` ahead of the `references/` beside it and every consumer's next `sync` is a diff of pure churn.
 * The locale is explicit for the same reason the comparator is, so the bytes do not follow the machine.
 */
export const managedRecord = (removable: string[]): string => {
  return `${JSON.stringify({
    removable: [...removable].toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    }),
  }, null, 2)}\n`;
};
