import { DEFAULT_ANSWERS } from '@answers';

import type { HostedAnswers } from '@config/types';

// `DEFAULT_ANSWERS` records no Node, and every route fills one before writing.
export const HOSTED_DEFAULTS: HostedAnswers = {
  ...DEFAULT_ANSWERS,
  nodeVersion: '26.9.0',
};
