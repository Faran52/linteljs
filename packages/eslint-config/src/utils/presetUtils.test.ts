import {
  describe,
  expect,
  it,
} from 'vitest';

import { presetOf } from './presetUtils';

describe('presetOf', () => {
  it('wraps a single flat config in an array', () => {
    const config = {
      name: 'probe',
      rules: {},
    };

    expect(presetOf(config, 'probe')).toEqual([config]);
  });

  it('passes an array of flat configs through', () => {
    const configs = [{ name: 'probe/one' }, { name: 'probe/two' }];

    expect(presetOf(configs, 'probe')).toBe(configs);
  });

  // A preset's own glob wins; `files` fills only an entry that names none.
  it('scopes every entry with no glob of its own to the files given', () => {
    expect(presetOf([{ name: 'probe/one' }, {
      name: 'probe/two',
      files: ['**/*.vue'],
    }], 'probe', ['**/*.ts'])).toEqual([{
      name: 'probe/one',
      files: ['**/*.ts'],
    }, {
      name: 'probe/two',
      files: ['**/*.vue'],
    }]);
    expect(presetOf({ name: 'probe' }, 'probe', ['**/*.ts'])).toEqual([{
      name: 'probe',
      files: ['**/*.ts'],
    }]);
  });

  it('throws when the plugin publishes no such preset', () => {
    expect(() => {
      return presetOf(undefined, 'probe/missing');
    }).toThrow(/probe\/missing is not published/);
  });

  it('throws on an eslintrc config, which flat config would reject far from here', () => {
    expect(() => {
      return presetOf({
        plugins: ['probe'],
        rules: {},
      }, 'probe/legacy');
    }).toThrow(/probe\/legacy is an eslintrc config/);
  });
});
