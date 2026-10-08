import { omit, pick } from 'es-toolkit';

import {
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  WORKSPACE_KEYS,
} from '../constants';
import { DEFAULT_ANSWERS, type LinteljsConfig } from '../registry';

import {
  configOf,
  projectAnswersOf,
  workspaceConfigOf,
} from './projectUtils';

describe('configOf', () => {
  it('lifts the workspace answers above one unnamed project in a single layout', () => {
    const actual = configOf({ ...DEFAULT_ANSWERS }, '@acme/web');
    const expected = {
      ...pick(DEFAULT_ANSWERS, WORKSPACE_KEYS),
      projects: [omit(DEFAULT_ANSWERS, WORKSPACE_KEYS)],
    };

    expect(actual).toStrictEqual(expected);
  });

  it('names a monorepo project for its directory, without the scope', () => {
    const actual = configOf({
      ...DEFAULT_ANSWERS,
      layout: 'monorepo',
    }, '@acme/web');

    expect(actual).toHaveProperty('projects.0.name', 'web');
  });

  it('kebab-cases a monorepo project name', () => {
    const actual = configOf({
      ...DEFAULT_ANSWERS,
      layout: 'monorepo',
    }, '@acme/my_app');

    expect(actual).toHaveProperty('projects.0.name', 'my-app');
  });
});

describe('workspaceConfigOf', () => {
  it('lists every project in order under the first one\'s workspace answers', () => {
    const monorepo = {
      ...DEFAULT_ANSWERS,
      layout: 'monorepo',
    };
    const actual = workspaceConfigOf([[monorepo, 'web'], [{
      ...monorepo,
      target: 'typescript',
    }, 'shared']]);

    expect(actual).toHaveProperty('layout', 'monorepo');
    expect(actual).toHaveProperty('projects.0.name', 'web');
    expect(actual).toHaveProperty('projects.1.name', 'shared');
    expect(actual).toHaveProperty('projects.1.target', 'typescript');
    expect(actual).not.toHaveProperty('projects.1.layout');
  });
});

describe('projectAnswersOf', () => {
  it('gives one project the workspace answers and drops its name', () => {
    const config: LinteljsConfig = {
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...pick(DEFAULT_ANSWERS, WORKSPACE_KEYS),
      layout: 'monorepo',
      projects: [{
        name: 'web',
        ...omit(DEFAULT_ANSWERS, WORKSPACE_KEYS),
      }],
    };

    const actual = projectAnswersOf(config, config.projects[0]);
    const expected = {
      ...DEFAULT_ANSWERS,
      layout: 'monorepo',
    };

    expect(actual).toStrictEqual(expected);
  });
});
