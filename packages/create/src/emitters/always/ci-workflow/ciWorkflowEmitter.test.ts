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
    const ciWorkflow = emitCiWorkflow(hostedAnswersFor({}));
    expect(ciWorkflow).toContain('- run: pnpm check');
  });

  it('names a script the project actually declares', () => {
    const managers = [
      'pnpm',
      'npm',
      'yarn',
      'bun',
    ] as const;

    for (const manager of managers) {
      const answers = hostedAnswersFor({ packageManager: manager });
      const scripts = buildScripts(answers);
      const workflow = emitCiWorkflow(answers);
      const [, script] = /- run: \S+(?: run)? ([\w:]+)\n$/.exec(workflow) ?? [];

      expect(script).toBeDefined();
      expect(scripts).toHaveProperty(script ?? '');
    }
  });

  it('runs CI on the major of the node that made the project', () => {
    const ciWorkflow = emitCiWorkflow(hostedAnswersFor({ nodeVersion: '26.9.0' }));
    expect(ciWorkflow).toContain('node-version: 26\n');
  });

  it('installs without letting the manager edit the lockfile', () => {
    const pnpmWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'pnpm' }));

    expect(pnpmWorkflow)
      .toContain('pnpm install --frozen-lockfile');

    const npmWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'npm' }));
    expect(npmWorkflow).toContain('npm ci');

    const yarnWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'yarn' }));

    expect(yarnWorkflow)
      .toContain('yarn install --immutable');

    const bunWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'bun' }));

    expect(bunWorkflow)
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
  ])('writes the steps a %s project runs', (packageManager, steps) => {
    const workflow = emitCiWorkflow(hostedAnswersFor({ packageManager }));
    const endsWithSteps = workflow.endsWith(steps);
    expect(endsWithSteps).toBe(true);
  });

  it('sets the two managers up that the runner does not carry', () => {
    const pnpmWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'pnpm' }));
    expect(pnpmWorkflow).toContain('pnpm/action-setup@');
    const bunWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'bun' }));
    expect(bunWorkflow).toContain('oven-sh/setup-bun@');
    const npmWorkflow = emitCiWorkflow(hostedAnswersFor({ packageManager: 'npm' }));
    expect(npmWorkflow).not.toContain('action-setup');
    expect(bunWorkflow).not.toContain('cache:');
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
    const ciWorkflow = emitCiWorkflow(hostedAnswersFor({}));
    expect(ciWorkflow).toContain('permissions:\n  contents: read');
  });
});

describe('ciWorkflowEmitter', () => {
  it('writes the emitted text to .github/workflows/ci.yml at the standard stage, once, at birth', () => {
    const artifacts = ciWorkflowEmitter(hostedAnswersFor({}));
    const text = emitCiWorkflow(hostedAnswersFor({}));
    const expected = [{
      stage: 'standard',
      target: '.github/workflows/ci.yml',
      content: { text },
      preserve: true,
    }];
    expect(artifacts).toEqual(expected);
  });
});
