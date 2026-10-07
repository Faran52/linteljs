import { type ParseArgsOptionsConfig } from 'node:util';

import { type Stage } from '@config/types';

// The answer lines go between the two halves, built from the records when the usage is printed.
export const USAGE_HEAD = `@linteljs/create [name] [options]
@linteljs/create sync [options]

  --existing        run in this directory, which already exists, rather than making <name>/
  --no-install      skip the install and the eslint --fix pass that needs it
  --seed            with --existing, plant the starter and seed files a new project is born with
  --skip <stage>    skip a stage: lint, package, standard, install, fix (repeatable)
  --yes, -y         accept the defaults, ask nothing; sync: accept every step
  --version, -v
  --help, -h

Answers, for a run that asks nothing (unset ones take the defaults):
`;

export const USAGE_TAIL = `
A list is comma-separated or the flag repeated.

Without a terminal, create needs --yes or an answer flag; a name alone exits 1.
With no name it takes the directory's.

sync rewrites plugins/linteljs/ without asking. It then asks before each of:
the @linteljs/* versions in package.json, the lint dependencies missing or
behind, and an eslint config that differs (backing it up first).
A missing eslint config is written. Without a terminal a step needs --yes.
Run it through the project's manager, which npx is only in an npm project:
pnpm dlx, npx, yarn dlx or bunx @linteljs/create sync.
`;

export const SYNC_NEEDS_YES = 'Skipped: sync asks before this step writes. Run it in a terminal, or pass --yes.';

export const EXISTING_MONOREPO = '--existing runs in a single repo; create a monorepo in a new directory.';

export const CLI_OPTIONS = {
  'existing': {
    type: 'boolean',
    default: false,
  },
  'no-install': {
    type: 'boolean',
    default: false,
  },
  'seed': {
    type: 'boolean',
    default: false,
  },
  'skip': {
    type: 'string',
    multiple: true,
    default: [],
  },
  'yes': {
    type: 'boolean',
    short: 'y',
    default: false,
  },
  'help': {
    type: 'boolean',
    short: 'h',
    default: false,
  },
  'version': {
    type: 'boolean',
    short: 'v',
    default: false,
  },
} satisfies ParseArgsOptionsConfig;

export const STAGE_LABELS: Record<Stage, string> = {
  lint: 'lint: eslint and stylelint config',
  package: 'package: package.json, tsconfig and the manager files',
  standard: 'standard: hooks, agent files, test setup and starter tests',
  install: 'install',
  fix: 'fix: eslint and stylelint --fix',
};

// Braille, so one cell turns rather than a word growing.
export const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

// Slow enough to read a stage's name, fast enough to look alive.
export const SPINNER_INTERVAL = 80;

export const MS_PER_SECOND = 1000;
