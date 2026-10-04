import { omit } from 'es-toolkit';
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
  it('writes the current envelope around every answer the target asks', () => {
    const parsed: unknown = JSON.parse(emitLinteljsConfig(DEFAULT_ANSWERS));

    expect(parsed).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...omit(DEFAULT_ANSWERS, ['browser']),
    });
  });

  it('leaves out the browser on react native, which never asks it', () => {
    const parsed: unknown = JSON.parse(emitLinteljsConfig({ ...DEFAULT_ANSWERS, target: 'react-native' }));

    expect(parsed).not.toHaveProperty('browser');
  });

  it('records the browser on a webextension, which asks it', () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
    } as const;
    const parsed: unknown = JSON.parse(emitLinteljsConfig(answers));

    expect(parsed).toHaveProperty('browser', 'firefox');
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
