import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { answerFlags } from '@e2e/utils/workspaceUtils';

import {
  caseLayout,
  concurrencyFrom,
  createArgs,
  userAgent,
} from './caseUtils.ts';
import { probes } from './probesUtils.ts';

import type { E2eCase } from '@e2e/matrix/matrix';

const probeFor = (target: string): E2eCase => {
  const probe = probes()
    .find(({ answers }) => {
      return answers.target === target;
    });

  if (probe === undefined) {
    throw new Error(`no ${target} probe`);
  }

  return probe;
};

describe('concurrencyFrom', () => {
  it('reads the number it is given', () => {
    const concurrency = concurrencyFrom('2');

    expect(concurrency).toBe(2);
  });

  it('runs four at once by default', () => {
    const concurrency = concurrencyFrom(undefined);

    expect(concurrency).toBe(4);
  });
});

describe('userAgent', () => {
  it('names the manager and its trimmed version the way the CLI reads them', () => {
    const agent = userAgent('pnpm', '11.2.0\n');

    expect(agent).toBe('pnpm/11.2.0 npm/? node/? collect');
  });
});

describe('caseLayout', () => {
  it('puts each case and manager in its own directory, the project named for the target', () => {
    const { answers } = probeFor('react');

    const layout = caseLayout({
      label: 'react and more',
      answers,
    }, 'npm', '/work');

    expect(layout).toEqual({
      root: join('/work', 'react-and-more-npm'),
      name: 'react',
      project: join('/work', 'react-and-more-npm', 'react'),
    });
  });

  it('names a react-native project rn-app', () => {
    const probe = probeFor('react-native');

    const layout = caseLayout(probe, 'pnpm', '/work');

    expect(layout.name).toBe('rn-app');
  });
});

describe('createArgs', () => {
  it('runs the CLI with the case answers and no install', () => {
    const { answers } = probeFor('react');

    const args = createArgs('/bin/create.mjs', 'react', answers);
    const flags = answerFlags(answers);

    expect(flags).toContain('--target');

    expect(args).toEqual([
      '/bin/create.mjs',
      'react',
      ...flags,
      '--no-install',
    ]);
  });
});
