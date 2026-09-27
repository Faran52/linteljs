import { expectTypeOf } from 'vitest';

import { CONFIG_SCHEMA_URL, CURRENT_SCHEMA_VERSION } from './constants';
import {
  type AnswerKey,
  ANSWERS,
  DEFAULT_ANSWERS,
} from './registry';
import { parseLinteljsConfig } from './utils/configUtils';

import type { Answers } from '@config/types';

describe('ANSWERS', () => {
  // The parser reads the field a record's own `key` names, so a record filed under another key reads the wrong one.
  it.each(Object.entries(ANSWERS))('files %s under its own key', (key, record) => {
    expect(record.key).toBe(key);
  });

  // `Answers` is written out in `config/types.ts`, below both rings, so nothing else ties its fields to the records.
  it('names one field of Answers per record', () => {
    expectTypeOf<keyof Answers>().toEqualTypeOf<AnswerKey>();
  });
});

describe('DEFAULT_ANSWERS', () => {
  it('is a config the parser accepts as it stands', () => {
    const config = {
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    };

    expect(parseLinteljsConfig(JSON.stringify(config))).toEqual(config);
  });
});
