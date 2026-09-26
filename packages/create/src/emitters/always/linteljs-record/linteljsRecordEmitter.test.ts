import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';

import { EMPTY_PROJECT } from '@config/constants';

import { type Answers, type HostedAnswers } from '@answers';

import { VERSIONS } from '../package-json/constants';

import { emitLinteljsRecord, linteljsRecordEmitter } from './linteljsRecordEmitter';

const answersFor = (overrides: Partial<Answers> = {}): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

// The pinned ranges move with every bump, so the page's versions are read off the table rather than restated.
const recorded = (name: string): string => {
  return (VERSIONS[name] ?? '').replace(/^[\^~]/u, '');
};

describe('emitLinteljsRecord', () => {
  // The module whole, since the starter imports it by these names: the project, its stack, what was answered.
  it('names the project and carries the framework the target renders with', () => {
    expect(emitLinteljsRecord(answersFor({ packageManagerVersion: '12.4.1' }), 'my-app')).toBe(`\
// Written once by @linteljs/create. Yours from here; the starter Version page is its only reader.
export const NAME = 'my-app';

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

  /*
   * A browser cannot read either off its machine, which is the half of this page that could never have been a
   * runtime read. Both are absent in a config written before they were recorded, and then print nothing.
   */
  it('writes the recorded node and manager versions, and leaves out what was never recorded', () => {
    const recorded = emitLinteljsRecord(answersFor({
      nodeVersion: '26.9.0',
      packageManagerVersion: '12.4.1',
    }), 'my-app');

    expect(recorded).toContain("version: '26.9.0'");
    expect(recorded).toContain("version: '12.4.1'");
    // Every run records its Node, so the manager's version is the one that can be absent.
    expect(emitLinteljsRecord(answersFor(), 'my-app')).not.toContain("name: 'pnpm'");
  });

  it('prints every answer a prompt asked, and nothing a record never asks', () => {
    const recorded = emitLinteljsRecord(answersFor({ store: 'zustand' }), 'my-app');

    expect(recorded).toContain("label: 'State store'");
    expect(recorded).toContain("value: 'zustand'");
    expect(recorded).not.toContain("label: 'Aliases'");
  });

  it('joins a multi-select into one line, and leaves an empty one out', () => {
    expect(emitLinteljsRecord(answersFor({ libraries: ['zod', 'es-toolkit'] }), 'my-app'))
      .toContain("value: 'zod, es-toolkit'");
    expect(emitLinteljsRecord(answersFor({ agents: [] }), 'my-app')).not.toContain("label: 'AI agents'");
  });
});

describe('linteljsRecordEmitter', () => {
  it('writes it where every starter reads it', () => {
    expect(linteljsRecordEmitter(answersFor(), EMPTY_PROJECT, 'my-app')).toEqual([{
      stage: 'standard',
      target: 'src/config/linteljs.ts',
      content: { text: emitLinteljsRecord(answersFor(), 'my-app') },
    }]);
  });
});
