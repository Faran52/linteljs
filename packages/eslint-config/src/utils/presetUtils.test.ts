import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';

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

describe('base: resolver', () => {
  const DEFAULTS = { alwaysTryTypes: true };

  const resolverSettingsOf = (layer: ReturnType<typeof base>) => {
    return layer.find((config) => {
      return config.settings?.['import-x/resolver'];
    })?.settings;
  };

  it('tries declaration files by default, and keeps the upstream parser settings', () => {
    const settings = resolverSettingsOf(base());

    expect(settings?.['import-x/resolver']).toEqual({ typescript: DEFAULTS });
    expect(settings).toHaveProperty('import-x/parsers');
    expect(settings).toHaveProperty('import-x/extensions');
    expect(settings).toHaveProperty('import-x/external-module-folders');
  });

  it('points the resolver at a named tsconfig when one is supplied, keeping the defaults', () => {
    const settings = resolverSettingsOf(base({ resolver: { project: 'packages/*/tsconfig.json' } }));

    expect(settings?.['import-x/resolver']).toEqual({
      typescript: {
        ...DEFAULTS,
        project: 'packages/*/tsconfig.json',
      },
    });
    expect(settings).toHaveProperty('import-x/parsers');
  });

  // Opt-in, never a default; see base.ts for the measurement.
  it('passes through the conditions a project asks for', () => {
    const conditionNames = ['import', 'types'];
    const settings = resolverSettingsOf(base({ resolver: { conditionNames } }));

    expect(settings?.['import-x/resolver']).toEqual({
      typescript: {
        ...DEFAULTS,
        conditionNames,
      },
    });
  });
});
