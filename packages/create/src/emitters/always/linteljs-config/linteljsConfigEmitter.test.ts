import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
} from '@answers';

import { emitLinteljsConfig, linteljsConfigEmitter } from './linteljsConfigEmitter';

describe('emitLinteljsConfig', () => {
  it('writes the current envelope around every answer', () => {
    const parsed: unknown = JSON.parse(emitLinteljsConfig(DEFAULT_ANSWERS));

    expect(parsed).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });
});

describe('linteljsConfigEmitter', () => {
  it('writes the emitted text to the recorded config path at the package stage', () => {
    const linteljsConfig = linteljsConfigEmitter(DEFAULT_ANSWERS);
    const expected = [{
      stage: 'package',
      target: CONFIG_PATH,
      content: { text: emitLinteljsConfig(DEFAULT_ANSWERS) },
    }];
    expect(linteljsConfig).toEqual(expected);
  });
});
