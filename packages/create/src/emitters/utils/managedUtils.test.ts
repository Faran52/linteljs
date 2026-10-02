import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitted, merged } from './artifactUtils';
import { managedRecord, removableIn } from './managedUtils';

describe('removableIn', () => {
  it('takes what this CLI writes whole', () => {
    const removable = removableIn([emitted('standard', 'eslint.config.js', '')]);
    const expected = ['eslint.config.js'];
    expect(removable).toEqual(expected);
  });

  it('leaves a preserved artifact out', () => {
    const removable = removableIn([{
      ...emitted('standard', 'CLAUDE.md', ''),
      preserve: true,
    }]);

    expect(removable).toEqual([]);
  });

  it('leaves a merge out', () => {
    const removable = removableIn([merged('standard', 'pnpm-workspace.yaml', () => {
      return '';
    })]);
    expect(removable).toEqual([]);
  });

  it('takes a merge that says it is removable', () => {
    const removable2 = removableIn([{
      ...merged('standard', '.claude/settings.json', () => {
        return '';
      }),
      removable: true,
    }]);
    const expected = ['.claude/settings.json'];
    expect(removable2).toEqual(expected);
  });
});

describe('managedRecord', () => {
  it('is json a later run can read back, ordered by locale rather than by code unit', () => {
    const parsed: unknown = JSON.parse(managedRecord(['B.js', 'a.js']));

    const expected = { removable: ['a.js', 'B.js'] };
    expect(parsed).toEqual(expected);
  });

  it('is stable across two runs of the same set', () => {
    const actual = managedRecord(['B.js', 'a.js']);
    expect(actual).toBe(managedRecord(['a.js', 'B.js']));
    const actual2 = managedRecord(['a.js']);
    expect(actual2).toMatch(/\n$/u);
  });
});
