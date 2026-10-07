// At a word boundary, so a longer flag it prefixes cannot stand in for it.
export const FLAGS = [
  '--existing',
  '--no-install',
  '--seed',
  '--skip',
  '--yes',
  '-y',
  '--help',
  '-h',
];

export const STAGES = [
  'lint',
  'package',
  'standard',
  'install',
  'fix',
];

// Negated in `files`, so a generated project inherits no test and no mod typecheck.
export const EXCLUDED_TEST = /^project\/(?:scripts|plugins)\/(?:.*\/)?[^/]+\.test\.tsx?$/;

export const EXCLUDED_MOD_TYPECHECK = /^project\/plugins\/linteljs\/(?:tsconfig\.json|\.claude-plugin\/types\/.*)$/;
