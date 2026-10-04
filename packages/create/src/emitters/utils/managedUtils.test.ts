import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitted } from './artifactUtils';
import { managedRecord, removableIn } from './managedUtils';

describe('removableIn', () => {
  it('takes what sits under plugins/linteljs/ and nothing outside it', () => {
    const removable = removableIn([
      emitted('standard', 'plugins/linteljs/hooks/hooks.json', ''),
      emitted('standard', 'eslint.config.js', ''),
      emitted('standard', 'plugins/other/file.md', ''),
    ]);

    const expected = ['plugins/linteljs/hooks/hooks.json'];
    expect(removable).toEqual(expected);
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
    const single = managedRecord(['a.js']);
    expect(single).toMatch(/\n$/u);
  });
});
