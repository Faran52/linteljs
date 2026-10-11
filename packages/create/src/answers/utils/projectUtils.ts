import { omit, pick } from 'es-toolkit';

import { projectNameOf } from '@utils/nameUtils';

import { WORKSPACE_KEYS } from '../constants';

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

// Flat answers per project in the v2 shape, the first project's workspace answers on top; a monorepo's project is
// named for its directory.
export const workspaceConfigOf = (entries: readonly ConfigEntry[]): FlatConfig => {
  const [[workspace] = [{}, '']] = entries;
  const body: FlatConfig = {
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
