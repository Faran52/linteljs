/**
 * What this CLI put in a project, recorded where it can rewrite it freely. `sync` removes what is in here and no
 * longer expected, which is the only way it can know that an answer used to ask for a file: the answers live in
 * `linteljs.config.json` and a hand edit to that file leaves no trace of what they were.
 *
 * Its own tree rather than the config, because the config is the project's to reformat and `sync` never rewrites
 * it. This file is nobody's but linteljs's, so a sync may.
 */
export const MANAGED_PATH = 'plugins/linteljs/managed.json';
