import { omit, pick } from 'es-toolkit';

import { projectNameOf } from '@utils/nameUtils';

import {
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  WORKSPACE_KEYS,
} from '../constants';

import type { Answers, ProjectConfig } from '@config/types';
import type { LinteljsConfig } from '../registry';
import type { JsonValue } from './readUtils';

type FlatConfig = Partial<Record<string, JsonValue>>;

export type ConfigEntry = readonly [FlatConfig, string];

const projectConfigOf = ([flat, name]: ConfigEntry): FlatConfig => {
  const project = omit(flat, WORKSPACE_KEYS);

  if (flat['layout'] !== 'monorepo') {
    return project;
  }

  const named = { name: projectNameOf(name), ...project };

  return named;
};

// A v2 config: the first project's workspace answers on top, then flat answers per project; a monorepo's project is
// named for its directory.
export const workspaceConfigOf = (entries: readonly [ConfigEntry, ...ConfigEntry[]]): FlatConfig => {
  const [[workspace]] = entries;
  const body: FlatConfig = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...pick(workspace, WORKSPACE_KEYS),
    projects: entries.map(projectConfigOf),
  };

  return body;
};

export const isWorkspaceKey = (key: string): boolean => {
  return WORKSPACE_KEYS
    .some((workspaceKey) => {
      return workspaceKey === key;
    });
};

export const configOf = (flat: FlatConfig, name: string): FlatConfig => {
  return workspaceConfigOf([[flat, name]]);
};

export const projectAnswersOf = (config: LinteljsConfig, project: ProjectConfig): Answers => {
  const answers: Answers = {
    ...omit(project, ['name']),
    ...pick(config, WORKSPACE_KEYS),
  };

  return answers;
};
