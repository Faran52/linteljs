import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Data,
  type HostedAnswers,
  type PackageManager,
  type Styling,
  type TargetId,
} from '#answers';

import { buildScripts } from '../utils/scriptUtils';

import { emitCiWorkflow } from './ciWorkflowEmitter';

import { HOSTED_DEFAULTS } from '#mocks/hostedAnswers';

interface AnswerOverrides {
  packageManager?: PackageManager;
  target?: TargetId;
  nodeVersion?: string;
  styling?: Styling;
  data?: Data;
}

const answersFor = (overrides: AnswerOverrides): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

describe('emitCiWorkflow', () => {
  it('runs the same gate the project runs locally', () => {
    expect(emitCiWorkflow(answersFor({}))).toContain('- run: pnpm check');
  });

  /**
   * The failure this file exists for: a reference repo pointed its workflow at `pnpm validate`, a script name that
   * was never added, and every push failed while the project gated clean. Deriving the command from `buildScripts`
   * rather than writing it out means the workflow cannot name a script `package.json` does not define.
   */
  it('names a script the project actually declares', () => {
    for (const manager of ['pnpm', 'npm', 'yarn', 'bun'] as const) {
      const answers = answersFor({ packageManager: manager });
      const scripts = buildScripts(answers);
      const [, script] = /- run: \S+(?: run)? ([\w:]+)\n$/.exec(emitCiWorkflow(answers)) ?? [];

      expect(script).toBeDefined();
      expect(scripts).toHaveProperty(script ?? '');
    }
  });

  // A project made on 26 and gated on the floor is a project CI has never run the way anyone develops it.
  it('runs CI on the major of the node that made the project', () => {
    expect(emitCiWorkflow(answersFor({ nodeVersion: '26.9.0' }))).toContain('node-version: 26\n');
  });

  it('installs without letting the manager edit the lockfile', () => {
    expect(emitCiWorkflow(answersFor({ packageManager: 'pnpm' })))
      .toContain('pnpm install --frozen-lockfile');
    expect(emitCiWorkflow(answersFor({ packageManager: 'npm' }))).toContain('npm ci');
    expect(emitCiWorkflow(answersFor({ packageManager: 'yarn' })))
      .toContain('yarn install --immutable');
    expect(emitCiWorkflow(answersFor({ packageManager: 'bun' })))
      .toContain('bun install --frozen-lockfile');
  });

  // The runner ships neither, and setup-node caches for neither.
  it('sets the two managers up that the runner does not carry', () => {
    expect(emitCiWorkflow(answersFor({ packageManager: 'pnpm' }))).toContain('pnpm/action-setup@');
    expect(emitCiWorkflow(answersFor({ packageManager: 'bun' }))).toContain('oven-sh/setup-bun@');
    expect(emitCiWorkflow(answersFor({ packageManager: 'npm' }))).not.toContain('action-setup');
    expect(emitCiWorkflow(answersFor({ packageManager: 'bun' }))).not.toContain('cache:');
  });

  // A tag can be moved onto different code without the reference here changing; a commit cannot.
  it('pins the third-party action to a commit and keeps the first-party ones on a major', () => {
    const workflow = emitCiWorkflow(answersFor({ packageManager: 'pnpm' }));

    expect(workflow).toMatch(/pnpm\/action-setup@[\da-f]{40} # v\d+\.\d+\.\d+/);
    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('actions/setup-node@v7');
  });

  it('reads nothing it does not need from the workflow token', () => {
    expect(emitCiWorkflow(answersFor({}))).toContain('permissions:\n  contents: read');
  });
});

// `--immutable` is Berry's; 1.x has never known it and would fail the workflow on its first run.
it('installs a classic project with the flag 1.x understands', () => {
  const workflow = emitCiWorkflow(answersFor({ packageManager: 'yarn-classic' }));

  expect(workflow).toContain('yarn install --frozen-lockfile');
  expect(workflow).not.toContain('--immutable');
  expect(workflow).toContain('cache: yarn');
});
