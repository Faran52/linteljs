import { hostedAnswersFor } from '@mocks/answersFor';

import { EMPTY_PROJECT } from '@config/constants';

import { VERSIONS } from '../../constants';

import { emitLinteljsRecord, linteljsRecordEmitter } from './linteljsRecordEmitter';

// The pinned ranges move with every bump, so the page's versions are read off the table rather than restated.
const recorded = (name: string): string => {
  return (VERSIONS[name] ?? '').replace(/^[\^~]/u, '');
};

describe('emitLinteljsRecord', () => {
  // The module whole, since the starter imports it by these names: the project, its stack, what was answered.
  it('names the project and carries the framework the target renders with', () => {
    expect(emitLinteljsRecord(hostedAnswersFor({ packageManagerVersion: '12.4.1' }), 'my-app')).toBe(`\
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
    const recorded = emitLinteljsRecord(hostedAnswersFor({
      nodeVersion: '26.9.0',
      packageManagerVersion: '12.4.1',
    }), 'my-app');

    expect(recorded).toContain("version: '26.9.0'");
    expect(recorded).toContain("version: '12.4.1'");
    // Every run records its Node, so the manager's version is the one that can be absent.
    expect(emitLinteljsRecord(hostedAnswersFor(), 'my-app')).not.toContain("name: 'pnpm'");
  });

  it('prints every answer a prompt asked, and nothing a record never asks', () => {
    const recorded = emitLinteljsRecord(hostedAnswersFor({ store: 'zustand' }), 'my-app');

    expect(recorded).toContain("label: 'State store'");
    expect(recorded).toContain("value: 'zustand'");
    expect(recorded).not.toContain("label: 'Aliases'");
  });

  it('joins a multi-select into one line, and leaves an empty one out', () => {
    expect(emitLinteljsRecord(hostedAnswersFor({ libraries: ['zod', 'es-toolkit'] }), 'my-app'))
      .toContain("value: 'zod, es-toolkit'");
    expect(emitLinteljsRecord(hostedAnswersFor({ agents: [] }), 'my-app')).not.toContain("label: 'AI agents'");
  });
});

describe('linteljsRecordEmitter', () => {
  it('writes it where every starter reads it', () => {
    expect(linteljsRecordEmitter(hostedAnswersFor(), EMPTY_PROJECT, 'my-app')).toEqual([{
      stage: 'standard',
      target: 'src/config/linteljs.ts',
      content: { text: emitLinteljsRecord(hostedAnswersFor(), 'my-app') },
    }]);
  });
});
