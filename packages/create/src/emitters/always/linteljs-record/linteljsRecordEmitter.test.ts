import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';

import { EMPTY_PROJECT } from '@config/constants';

import { type Answers, type HostedAnswers } from '@answers';

import { emitLinteljsRecord, linteljsRecordEmitter } from './linteljsRecordEmitter';

const answersFor = (overrides: Partial<Answers> = {}): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

describe('emitLinteljsRecord', () => {
  it('names the project, since the starter renders it', () => {
    expect(emitLinteljsRecord(answersFor(), 'my-app')).toContain("export const NAME = 'my-app';");
  });

  it('carries the framework the target renders with', () => {
    expect(emitLinteljsRecord(answersFor(), 'my-app')).toContain("name: 'react'");
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
  it('writes it where the record says, for a target that owns its template', () => {
    expect(linteljsRecordEmitter(answersFor(), EMPTY_PROJECT, 'my-app').map((artifact) => {
      return artifact.target;
    })).toEqual(['src/config/linteljs.ts']);
  });

  // Nothing would import it: that target's starter is still the generator's own.
});
