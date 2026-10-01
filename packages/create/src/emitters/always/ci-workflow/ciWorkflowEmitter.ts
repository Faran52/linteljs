import { RUN_PREFIX } from '@config/constants';
import {
  type Artifact,
  type HostedAnswers,
  type PackageManager,
} from '@config/types';

import { majorOf } from '@utils/versionUtils';

import { emitted } from '../../utils/artifactUtils';

// Emitted, not preserved: it is the gate, and a stale copy would go on calling a renamed script.

interface ManagerSetup {
  before?: string;
  cache?: string;
  install: string;
}

// Third-party actions are pinned to a commit, since a tag can move; GitHub's own go by major tag.
const MANAGER_SETUP: Record<PackageManager, ManagerSetup> = {
  pnpm: {
    before: '- uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10',
    cache: 'pnpm',
    install: 'pnpm install --frozen-lockfile',
  },
  // The only install that refuses to edit the lockfile.
  npm: {
    cache: 'npm',
    install: 'npm ci',
  },
  yarn: {
    cache: 'yarn',
    install: 'yarn install --immutable',
  },
  // `setup-node` fails outright on a `cache` value it does not know.
  bun: {
    before: '- uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0',
    install: 'bun install --frozen-lockfile',
  },
};

export const emitCiWorkflow = (answers: HostedAnswers): string => {
  const setup = MANAGER_SETUP[answers.packageManager];

  const before = setup.before === undefined ? '' : `      ${setup.before}\n\n`;

  const cache = setup.cache === undefined ? '' : `\n          cache: ${setup.cache}`;

  // The Node that made the project; a bare major cannot resolve below `engines.node`.
  const nodeMajor = String(majorOf(answers.nodeVersion));

  return `# The gate in front of every push, written by @linteljs/create. It runs exactly what \`${
    RUN_PREFIX[answers.packageManager]
  } check\`
# runs locally, so a green commit here means the same checks passed. Add a second workflow file
# beside this one for anything else; this one is replaced on every \`linteljs sync\`.
name: ci

on:
  push:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

${before}      - uses: actions/setup-node@v7
        with:
          node-version: ${nodeMajor}${cache}

      - run: ${setup.install}

      - run: ${RUN_PREFIX[answers.packageManager]} check
`;
};

export const ciWorkflowEmitter = (answers: HostedAnswers): Artifact[] => {
  return [emitted('standard', '.github/workflows/ci.yml', emitCiWorkflow(answers))];
};
