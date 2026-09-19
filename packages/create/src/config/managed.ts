import type { Artifact } from './artifact';

/**
 * What this CLI put in a project, recorded where it can rewrite it freely. `sync` removes what is in here and no
 * longer expected, which is the only way it can know that an answer used to ask for a file: the answers live in
 * `linteljs.config.json` and a hand edit to that file leaves no trace of what they were.
 *
 * Its own tree rather than the config, because the config is the project's to reformat and `sync` never rewrites
 * it. This file is nobody's but linteljs's, so a sync may.
 */
export const MANAGED_PATH = 'plugins/linteljs/managed.json';

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
