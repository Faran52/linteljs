import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';

import {
  type Answers,
  DEFAULT_ANSWERS,
  type HostedAnswers,
} from '@answers';

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
