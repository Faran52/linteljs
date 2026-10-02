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
  it.each(Object.entries(ANSWERS))('files %s under its own key', (key, record) => {
    expect(record.key).toBe(key);
  });

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

    const actual = parseLinteljsConfig(JSON.stringify(config));
    expect(actual).toEqual(config);
  });
});
