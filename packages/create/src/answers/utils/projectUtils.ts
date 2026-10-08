import { omit, pick } from 'es-toolkit';

import { projectNameOf } from '@utils/nameUtils';

import { WORKSPACE_KEYS } from '../constants';

import type { Answers, ProjectConfig } from '@config/types';
import type { LinteljsConfig } from '../registry';
import type { JsonValue } from './readUtils';

type FlatConfig = Partial<Record<string, JsonValue>>;

// One project's flat answers in the v3 shape; a monorepo's project is named for its `apps/` directory.
export const configOf = (flat: FlatConfig, name: string): FlatConfig => {
  const project = omit(flat, WORKSPACE_KEYS);
  const body: FlatConfig = {
    ...pick(flat, WORKSPACE_KEYS),
    projects: [flat['layout'] === 'monorepo' ? { name: projectNameOf(name), ...project } : project],
  };

  return body;
};

export const projectAnswersOf = (config: LinteljsConfig, project: ProjectConfig): Answers => {
  const answers: Answers = {
    ...omit(project, ['name']),
    ...pick(config, WORKSPACE_KEYS),
  };

  return answers;
};
