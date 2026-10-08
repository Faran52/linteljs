import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import { omit, pick } from 'es-toolkit';
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
  WORKSPACE_KEYS,
} from '@answers';

import { workspaceOf } from '../../utils/layoutUtils';

import { emitLinteljsConfig, linteljsConfigEmitter } from './linteljsConfigEmitter';

import type { HostedAnswers } from '@config/types';

describe('emitLinteljsConfig', () => {
  it('writes the workspace answers above the one project the target asks', () => {
    const parsed: unknown = JSON.parse(emitLinteljsConfig(DEFAULT_ANSWERS, 'demo-app'));

    expect(parsed).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...pick(DEFAULT_ANSWERS, WORKSPACE_KEYS),
      projects: [omit(DEFAULT_ANSWERS, ['browser', ...WORKSPACE_KEYS])],
    });
  });

  it('names a monorepo project for its apps/ directory, without the scope', () => {
    const emitted = emitLinteljsConfig({ ...DEFAULT_ANSWERS, layout: 'monorepo' }, '@acme/demo-app');
    const parsed: unknown = JSON.parse(emitted);

    expect(parsed).toHaveProperty('projects.0.name', 'demo-app');
  });

  it('leaves out the browser on react native, which never asks it', () => {
    const parsed: unknown = JSON.parse(emitLinteljsConfig({ ...DEFAULT_ANSWERS, target: 'react-native' }, 'demo-app'));

    expect(parsed).toHaveProperty('projects.0.target', 'react-native');
    expect(parsed).not.toHaveProperty('projects.0.browser');
  });

  it('records the browser on a webextension, which asks it', () => {
    const answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
    } as const;
    const parsed: unknown = JSON.parse(emitLinteljsConfig(answers, 'demo-app'));

    expect(parsed).toHaveProperty('projects.0.browser', 'firefox');
  });
});

describe('linteljsConfigEmitter', () => {
  it('writes the emitted text to the recorded config path at the package stage', () => {
    const linteljsConfig = linteljsConfigEmitter(workspaceOf('demo-app', [{
      name: 'demo-app',
      answers: HOSTED_DEFAULTS,
    }]));
    const expected = [{
      stage: 'package',
      target: CONFIG_PATH,
      content: { text: emitLinteljsConfig(HOSTED_DEFAULTS, 'demo-app') },
    }];
    expect(linteljsConfig).toEqual(expected);
  });

  it('records every project of a workspace', () => {
    const monorepo: HostedAnswers = {
      ...HOSTED_DEFAULTS,
      layout: 'monorepo',
    };
    const [artifact] = linteljsConfigEmitter(workspaceOf('acme', [{
      name: 'web',
      answers: monorepo,
    }, {
      name: 'admin',
      answers: {
        ...monorepo,
        target: 'vue',
      },
    }]));
    const text = artifact !== undefined && 'text' in artifact.content ? artifact.content.text : '';
    const parsed: unknown = JSON.parse(text);

    expect(parsed).toHaveProperty('projects.0.name', 'web');
    expect(parsed).toHaveProperty('projects.1.name', 'admin');
    expect(parsed).toHaveProperty('projects.1.target', 'vue');
  });
});
