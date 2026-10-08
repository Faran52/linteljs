import { DEFAULT_ANSWERS } from '@answers';

import { HOSTED_DEFAULTS } from './hostedAnswers';

import type {
  Answers,
  HostedAnswers,
  Workspace,
} from '@config/types';

export const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  const answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };

  return answers;
};

// One project named `acme`, as `create acme` builds it.
export const soloOf = (answers: Answers): Workspace => {
  const workspace: Workspace = {
    name: 'acme',
    projects: [{
      name: 'acme',
      answers: {
        ...answers,
        nodeVersion: answers.nodeVersion ?? HOSTED_DEFAULTS.nodeVersion,
      },
    }],
  };

  return workspace;
};

export const workspaceFor = (overrides: Partial<Answers> = {}): Workspace => {
  const answers = answersFor(overrides);

  return soloOf(answers);
};

export const hostedAnswersFor = (overrides: Partial<HostedAnswers> = {}): HostedAnswers => {
  const answers = {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };

  return answers;
};
