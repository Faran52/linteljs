import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitted, merged } from './artifactUtils';
import { managedRecord, removableIn } from './managedUtils';

describe('removableIn', () => {
  it('takes what this CLI writes whole', () => {
    expect(removableIn([emitted('standard', 'eslint.config.js', '')])).toEqual(['eslint.config.js']);
  });

  it('leaves a preserved artifact out', () => {
    const removable = removableIn([{
      ...emitted('standard', 'CLAUDE.md', ''),
      preserve: true,
    }]);

    expect(removable).toEqual([]);
  });

  it('leaves a merge out', () => {
    expect(removableIn([merged('standard', 'pnpm-workspace.yaml', () => {
      return '';
    })])).toEqual([]);
  });

  it('takes a merge that says it is removable', () => {
    expect(removableIn([{
      ...merged('standard', '.claude/settings.json', () => {
        return '';
      }),
      removable: true,
    }])).toEqual(['.claude/settings.json']);
  });
});

describe('managedRecord', () => {
  it('is json a later run can read back, ordered by locale rather than by code unit', () => {
    const parsed: unknown = JSON.parse(managedRecord(['B.js', 'a.js']));

    expect(parsed).toEqual({ removable: ['a.js', 'B.js'] });
  });

  it('is stable across two runs of the same set', () => {
    expect(managedRecord(['B.js', 'a.js'])).toBe(managedRecord(['a.js', 'B.js']));
    expect(managedRecord(['a.js'])).toMatch(/\n$/u);
  });
});
