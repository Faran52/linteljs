import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

// Thrown by `cli.ts` before `ask`: nothing here can tell no terminal from a cancel.
export const NOTHING_ANSWERED_MESSAGE
  = 'Nothing was written: answer every question, or pass --yes to accept the defaults.';

export const RUN_CANCELLED_MESSAGE = 'Cancelled: nothing was written.';

export const ANSWER_KEYS = keysOf(ANSWERS);
