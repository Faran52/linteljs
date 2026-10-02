import { DEFAULT_ANSWERS } from '@answers';

import { HOSTED_DEFAULTS } from './hostedAnswers';

import type { Answers, HostedAnswers } from '@config/types';

export const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  const answers = {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };

  return answers;
};

export const hostedAnswersFor = (overrides: Partial<HostedAnswers> = {}): HostedAnswers => {
  const answers = {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };

  return answers;
};
