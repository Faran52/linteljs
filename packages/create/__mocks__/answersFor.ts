import { DEFAULT_ANSWERS } from '@answers';

import { HOSTED_DEFAULTS } from './hostedAnswers';

import type { Answers, HostedAnswers } from '@config/types';

export const answersFor = (overrides: Partial<Answers> = {}): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    ...overrides,
  };
};

export const hostedAnswersFor = (overrides: Partial<HostedAnswers> = {}): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};
