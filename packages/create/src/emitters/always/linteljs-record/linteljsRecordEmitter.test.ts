import { hostedAnswersFor } from '@mocks/answersFor';

import { EMPTY_PROJECT } from '@config/constants';

import { VERSIONS } from '../../constants';

import { emitLinteljsRecord, linteljsRecordEmitter } from './linteljsRecordEmitter';

const recorded = (name: string): string => {
  return (VERSIONS[name] ?? '').replace(/^[\^~]/u, '');
};

describe('emitLinteljsRecord', () => {
  it('names the project and carries the framework the target renders with', () => {
    const linteljsRecord = emitLinteljsRecord(hostedAnswersFor({ packageManagerVersion: '12.4.1' }), 'my-app');

    expect(linteljsRecord).toBe(`\
// Written once by @linteljs/create. Yours from here; only the starter pages read it.
export const NAME = 'my-app';

export const CHECK = 'pnpm check';

export const GATE = [
  {
    command: 'pnpm lint',
    runs: 'eslint .',
  },
  {
    command: 'pnpm lint:types',
    runs: 'node scripts/checkBannedPatterns.ts src',
  },
  {
    command: 'pnpm lint:css',
    runs: 'stylelint "src/**/*.css" --allow-empty-input',
  },
  {
    command: 'pnpm typecheck',
    runs: 'tsc --noEmit',
  },
  {
    command: 'pnpm test:coverage',
    runs: 'vitest run --coverage',
  },
  {
    command: 'pnpm build',
    runs: 'vite build',
  },
] as const;

export const STACK = [
  {
    name: 'linteljs',
    version: '${recorded('@linteljs/eslint-config')}',
  },
  {
    name: 'react',
    version: '${recorded('react')}',
  },
  {
    name: 'typescript',
    version: '${recorded('typescript')}',
  },
  {
    name: 'node',
    version: '26.9.0',
  },
  {
    name: 'pnpm',
    version: '12.4.1',
  },
] as const;

export const ANSWERS = [
  {
    label: 'Framework',
    value: 'react',
  },
  {
    label: 'Browser',
    value: 'chrome',
  },
  {
    label: 'Testing',
    value: 'vitest',
  },
  {
    label: 'Libraries',
    value: 'es-toolkit',
  },
  {
    label: 'Type safety',
    value: 'strict',
  },
  {
    label: 'AI agents',
    value: 'claude-code',
  },
  {
    label: 'AI plugins',
    value: 'ponytail, context7, frontend-design',
  },
] as const;
`);
  });

  it('writes the recorded node and manager versions, and leaves out what was never recorded', () => {
    const recorded = emitLinteljsRecord(hostedAnswersFor({
      nodeVersion: '26.9.0',
      packageManagerVersion: '12.4.1',
    }), 'my-app');

    expect(recorded).toContain("version: '26.9.0'");
    expect(recorded).toContain("version: '12.4.1'");
    const linteljsRecord = emitLinteljsRecord(hostedAnswersFor(), 'my-app');
    expect(linteljsRecord).not.toContain("name: 'pnpm'");
  });

  it('prints every answer a prompt asked, and nothing a record never asks', () => {
    const recorded = emitLinteljsRecord(hostedAnswersFor({ store: 'zustand' }), 'my-app');

    expect(recorded).toContain("label: 'State store'");
    expect(recorded).toContain("value: 'zustand'");
    expect(recorded).not.toContain("label: 'Aliases'");
  });

  it('wraps a name too long for one line, so the project passes its own max-len', () => {
    const name = 'n'.repeat(100);
    const recorded = emitLinteljsRecord(hostedAnswersFor(), name);

    expect(recorded).toContain(`export const NAME\n  = '${name}';\n`);
  });

  it('joins a multi-select into one line, and leaves an empty one out', () => {
    const withLibraries = emitLinteljsRecord(hostedAnswersFor({ libraries: ['zod', 'es-toolkit'] }), 'my-app');

    expect(withLibraries)
      .toContain("value: 'zod, es-toolkit'");

    const withoutAgents = emitLinteljsRecord(hostedAnswersFor({ agents: [] }), 'my-app');
    expect(withoutAgents).not.toContain("label: 'AI agents'");
  });
});

describe('the gate it records', () => {
  it('names the check under the manager that runs it', () => {
    const recorded = emitLinteljsRecord(hostedAnswersFor({ packageManager: 'npm' }), 'my-app');

    expect(recorded).toContain("export const CHECK = 'npm run check';");
    expect(recorded).toContain("command: 'npm run build',");
  });
});

describe('linteljsRecordEmitter', () => {
  it('writes it where every starter reads it', () => {
    const artifacts = linteljsRecordEmitter(hostedAnswersFor(), EMPTY_PROJECT, 'my-app');
    const text = emitLinteljsRecord(hostedAnswersFor(), 'my-app');
    const expected = [{
      stage: 'standard',
      target: 'src/config/linteljs.ts',
      content: { text },
    }];
    expect(artifacts).toEqual(expected);
  });
});
