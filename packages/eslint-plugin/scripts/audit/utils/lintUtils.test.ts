import { Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { rules } from '../../../src/rules/registry.ts';

import {
  configFor,
  moduleOf,
  RULE_IDS,
} from './lintUtils.ts';

const lint = (code: string, filename: string, settings: Linter.RulesRecord = {}): Linter.LintMessage[] => {
  const config = configFor(rules, settings, { reportUnusedDisableDirectives: 'error' });
  const messages = new Linter({ configType: 'flat' }).verify(code, config, filename);

  return messages;
};

describe('RULE_IDS', () => {
  it('lists every registered rule', () => {
    const expected = Object.keys(rules);

    expect(RULE_IDS).toEqual(expected);
  });
});

describe('moduleOf', () => {
  it('answers the registered module', () => {
    const module = moduleOf('union-newline');

    expect(module).toBe(rules['union-newline']);
  });

  it('names the known rules when the id is unknown', () => {
    const answering = (): void => {
      moduleOf('nope');
    };

    expect(answering).toThrow(`unknown rule: nope\nknown: ${Object.keys(rules).join(', ')}`);
  });
});

describe('configFor', () => {
  it.each([
    ['a.ts', 'const a: number = 1;\nexport { a };\n'],
    ['a.tsx', 'export const a = <div />;\n'],
  ])('parses %s as TypeScript', (filename, code) => {
    const messages = lint(code, filename);

    expect(messages).toEqual([]);
  });

  it.each([
    ['a.js', 'export const a = <div />;\n'],
    ['a.cjs', 'module.exports = <div />;\n'],
  ])('parses %s with espree and JSX', (filename, code) => {
    const messages = lint(code, filename);

    expect(messages).toEqual([]);
  });

  it('keeps JavaScript off the TypeScript parser', () => {
    const messages = lint('const a: number = 1;\n', 'a.js');

    expect(messages.at(0)?.fatal).toBe(true);
  });

  it.each(['a.ts', 'a.js'])('applies the settings and the linter options it is given to %s', (filename) => {
    const code = '// eslint-disable-next-line no-console\nvar a = 1;\nexport { a };\n';

    const messages = lint(code, filename, { 'no-var': 'error' });

    const ruleIds = messages
      .map((message) => {
        return message.ruleId;
      });
    expect(ruleIds).toEqual([null, 'no-var']);
  });

  it('runs the plugin rules under the @linteljs prefix', () => {
    const config = configFor(rules, { '@linteljs/union-newline': 'error' }, {});

    const plugins = config
      .map((entry) => {
        return entry.plugins?.['@linteljs']?.rules;
      });
    expect(plugins).toEqual([rules, rules]);
  });
});
