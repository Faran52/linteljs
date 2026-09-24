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
    expect(JSON.parse(emitLinteljsConfig(DEFAULT_ANSWERS))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });
});

describe('linteljsConfigEmitter', () => {
  it('writes the emitted text to the recorded config path at the package stage', () => {
    expect(linteljsConfigEmitter(DEFAULT_ANSWERS)).toEqual([{
      stage: 'package',
      target: CONFIG_PATH,
      content: { text: emitLinteljsConfig(DEFAULT_ANSWERS) },
    }]);
  });
});
