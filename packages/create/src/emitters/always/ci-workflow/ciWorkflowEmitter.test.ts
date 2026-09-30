import { hostedAnswersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { buildScripts } from '../utils/scriptUtils';

import { ciWorkflowEmitter, emitCiWorkflow } from './ciWorkflowEmitter';

import type { PackageManager } from '@config/types';

describe('emitCiWorkflow', () => {
  it('runs the same gate the project runs locally', () => {
    expect(emitCiWorkflow(hostedAnswersFor({}))).toContain('- run: pnpm check');
  });

  it('names a script the project actually declares', () => {
    for (const manager of ['pnpm', 'npm', 'yarn', 'bun'] as const) {
      const answers = hostedAnswersFor({ packageManager: manager });
      const scripts = buildScripts(answers);
      const [, script] = /- run: \S+(?: run)? ([\w:]+)\n$/.exec(emitCiWorkflow(answers)) ?? [];

      expect(script).toBeDefined();
      expect(scripts).toHaveProperty(script ?? '');
    }
  });

  it('runs CI on the major of the node that made the project', () => {
    expect(emitCiWorkflow(hostedAnswersFor({ nodeVersion: '26.9.0' }))).toContain('node-version: 26\n');
  });

  it('installs without letting the manager edit the lockfile', () => {
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'pnpm' })))
      .toContain('pnpm install --frozen-lockfile');
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'npm' }))).toContain('npm ci');
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'yarn' })))
      .toContain('yarn install --immutable');
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'bun' })))
      .toContain('bun install --frozen-lockfile');
  });

  it.each<[PackageManager, string]>([
    ['npm', `    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: npm

      - run: npm ci

      - run: npm run check
`],
    ['bun', `    steps:
      - uses: actions/checkout@v7

      - uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0

      - uses: actions/setup-node@v7
        with:
          node-version: 26

      - run: bun install --frozen-lockfile

      - run: bun run check
`],
    ['pnpm', `    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10

      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm check
`],
    ['yarn', `    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: yarn

      - run: yarn install --immutable

      - run: yarn check
`],
    ['yarn-classic', `    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: yarn

      - run: yarn install --frozen-lockfile

      - run: yarn run check
`],
  ])('writes the steps a %s project runs', (packageManager, steps) => {
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager })).endsWith(steps)).toBe(true);
  });

  it('sets the two managers up that the runner does not carry', () => {
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'pnpm' }))).toContain('pnpm/action-setup@');
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'bun' }))).toContain('oven-sh/setup-bun@');
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'npm' }))).not.toContain('action-setup');
    expect(emitCiWorkflow(hostedAnswersFor({ packageManager: 'bun' }))).not.toContain('cache:');
  });

  it('pins the third-party action to a commit and keeps the first-party ones on a major', () => {
    const workflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'pnpm' }));
    const bunWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'bun' }));

    expect(workflow).toMatch(/pnpm\/action-setup@[\da-f]{40} # v\d+\.\d+\.\d+/);
    expect(bunWorkflow).toMatch(/oven-sh\/setup-bun@[\da-f]{40} # v2\.\d+\.\d+/);
    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('actions/setup-node@v7');
  });

  it('reads nothing it does not need from the workflow token', () => {
    expect(emitCiWorkflow(hostedAnswersFor({}))).toContain('permissions:\n  contents: read');
  });
});

it('installs a classic project with the flag 1.x understands', () => {
  const workflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'yarn-classic' }));

  expect(workflow).toContain('yarn install --frozen-lockfile');
  expect(workflow).not.toContain('--immutable');
  expect(workflow).toContain('cache: yarn');
});

describe('ciWorkflowEmitter', () => {
  it('writes the emitted text to .github/workflows/ci.yml at the standard stage', () => {
    expect(ciWorkflowEmitter(hostedAnswersFor({}))).toEqual([{
      stage: 'standard',
      target: '.github/workflows/ci.yml',
      content: { text: emitCiWorkflow(hostedAnswersFor({})) },
    }]);
  });
});
