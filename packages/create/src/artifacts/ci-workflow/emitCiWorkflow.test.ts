import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type PackageManager,
  type TargetId,
} from '../../model/answers/answers';
import { buildScripts } from '../build-scripts/buildScripts';
import { NODE_ENGINE } from '../package-json/versions';

import { emitCiWorkflow } from './emitCiWorkflow';

interface AnswerOverrides {
  packageManager?: PackageManager;
  target?: TargetId;
}

const answersFor = (overrides: AnswerOverrides): Answers => {
  return {
    ...DEFAULT_ANSWERS,
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

  // A runner resolving a floating `24` to something under the declared floor would install a Node the project says
  // it does not support, so the workflow names the version `engines.node` resolves to.
  it('pins the node version to what engines declares', () => {
    expect(emitCiWorkflow(answersFor({}))).toContain(`node-version: ${NODE_ENGINE.replace('>=', '')}`);
    expect(emitCiWorkflow(answersFor({}))).not.toContain('node-version: 24\n');
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
