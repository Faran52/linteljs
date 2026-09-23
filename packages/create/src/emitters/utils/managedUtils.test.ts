import {
  describe,
  expect,
  it,
} from 'vitest';

import { managedRecord, removableIn } from './managedUtils';

import type { Artifact } from '@config/types';

const emittedAt = (target: string): Artifact => {
  return {
    stage: 'standard',
    target,
    content: { text: '' },
  };
};

const mergedAt = (target: string): Artifact => {
  return {
    stage: 'standard',
    target,
    content: {
      merge: () => {
        return '';
      },
    },
  };
};

describe('removableIn', () => {
  it('takes what this CLI writes whole', () => {
    expect(removableIn([emittedAt('eslint.config.js')])).toEqual(['eslint.config.js']);
  });

  // The project's from the moment it has one, so a deselected answer leaves it rather than deleting it.
  it('leaves a preserved artifact out', () => {
    expect(removableIn([{
      ...emittedAt('CLAUDE.md'),
      preserve: true,
    }])).toEqual([]);
  });

  // `pnpm-workspace.yaml` and a tailwind style entry carry lines nobody else wrote a copy of.
  it('leaves a merge out', () => {
    expect(removableIn([mergedAt('pnpm-workspace.yaml')])).toEqual([]);
  });

  // The whole file exists because a host was selected, which is what the flag says.
  it('takes a merge that says it is removable', () => {
    expect(removableIn([{
      ...mergedAt('.claude/settings.json'),
      removable: true,
    }])).toEqual(['.claude/settings.json']);
  });
});

describe('managedRecord', () => {
  /*
   * Mixed case on purpose: the two comparators agree on every same-case pair, so `['b.js', 'a.js']` passed this
   * under a bare `.sort()` too. `a.js` before `B.js` is the locale order and the reverse is the code-unit one.
   */
  it('is json a later run can read back, ordered by locale rather than by code unit', () => {
    const parsed: unknown = JSON.parse(managedRecord(['B.js', 'a.js']));

    expect(parsed).toEqual({ removable: ['a.js', 'B.js'] });
  });

  // Sorted and newline-ended, so a run that writes the same set writes the same bytes and `sync` reports nothing.
  it('is stable across two runs of the same set', () => {
    expect(managedRecord(['B.js', 'a.js'])).toBe(managedRecord(['a.js', 'B.js']));
    expect(managedRecord(['a.js'])).toMatch(/\n$/u);
  });
});
