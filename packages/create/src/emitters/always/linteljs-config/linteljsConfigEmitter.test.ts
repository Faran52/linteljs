import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
} from '@answers';

import { emitLinteljsConfig } from './linteljsConfigEmitter';

describe('emitLinteljsConfig', () => {
  it('writes the current envelope around every answer', () => {
    expect(JSON.parse(emitLinteljsConfig(DEFAULT_ANSWERS))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });
});
