import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '../../../answers/answers';
import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from '../../../answers/lintelConfig';

import { emitLintelConfig } from './lintelConfigEmitter';

describe('emitLintelConfig', () => {
  it('writes the current envelope around every answer', () => {
    expect(JSON.parse(emitLintelConfig(DEFAULT_ANSWERS))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });
});
