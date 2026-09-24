import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

// Thrown by `cli.ts` before `ask`: nothing here can tell "no terminal" from a person who cancelled one.
export const NOTHING_ANSWERED_MESSAGE
  = 'Nothing was written: answer every question, or pass --yes to accept the defaults.';

// Ctrl+C on purpose, told apart by being thrown as a `RunCancelled`.
export const RUN_CANCELLED_MESSAGE = 'Cancelled: nothing was written.';

// Every key `ANSWERS` has, read off the object itself rather than a hand-kept list.
export const ANSWER_KEYS = valuesOf(ANSWERS);
