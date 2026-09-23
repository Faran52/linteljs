import { DEFAULT_ANSWERS, type HostedAnswers } from '@answers';

// What a run hands the stages: `DEFAULT_ANSWERS` records no Node, and every route fills one before writing.
export const HOSTED_DEFAULTS: HostedAnswers = {
  ...DEFAULT_ANSWERS,
  nodeVersion: '26.9.0',
};
