import { join } from 'node:path';

import { answerFlags } from '@e2e/utils/workspaceUtils';

import { DEFAULT_CONCURRENCY } from '../constants.ts';

import type { E2eCase } from '@e2e/matrix/matrix';
import type { Collected } from './passesUtils.ts';

interface CaseLayout {
  root: string;
  name: string;
  project: string;
}

export const concurrencyFrom = (value: string | undefined): number => {
  return Number(value ?? DEFAULT_CONCURRENCY);
};

// The CLI reads its manager from `npm_config_user_agent`.
export const userAgent = (pm: Collected, versionOutput: string): string => {
  return `${pm}/${versionOutput.trim()} npm/? node/? collect`;
};

export const caseLayout = ({ label, answers }: E2eCase, pm: Collected, workspace: string): CaseLayout => {
  const root = join(workspace, `${label.replaceAll(' ', '-')}-${pm}`);
  const name = answers.target === 'react-native' ? 'rn-app' : answers.target;
  const layout = {
    root,
    name,
    project: join(root, name),
  };

  return layout;
};

// `--no-install`, so the manifests exist before the allowance is stripped.
export const createArgs = (cliBin: string, name: string, answers: E2eCase['answers']): string[] => {
  const args = [
    cliBin,
    name,
    ...answerFlags(answers),
    '--no-install',
  ];

  return args;
};
