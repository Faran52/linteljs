import { ruleIdsFor } from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../layers/base/baseLayer';

import { presetOf, sonarjsRules } from './presetUtils';

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

  it('scopes every entry with no glob of its own to the files given', () => {
    const preset = presetOf([{ name: 'probe/one' }, {
      name: 'probe/two',
      files: ['**/*.vue'],
    }], 'probe', ['**/*.ts']);

    expect(preset).toEqual([{
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

describe('sonarjsRules', () => {
  const rule = 'sonarjs/no-mutate-reactive-state-in-updated-hook';
  const mutating = sonarjsRules('test/sonarjs', { [rule]: 'error' }, ['**/*.ts']);
  const code = "import { ref } from 'vue';\n\nconst count = ref(0);\n\n"
    + 'export default { updated() { count.value++; } };\n';

  it('turns a sonarjs rule on with no other layer beneath it', async () => {
    await expect(ruleIdsFor(mutating, code, 'src/card.ts')).resolves.toContain(rule);
  });

  it('registers the plugin object base registers, so the two compose', async () => {
    await expect(ruleIdsFor([...base(), ...mutating], code, 'src/card.ts')).resolves.toContain(rule);
  });
});
