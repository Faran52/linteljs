import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

// Thrown by `cli.ts` before `ask`: nothing here can tell "no terminal" from a person who cancelled one.
export const NOTHING_ANSWERED_MESSAGE
  = 'Nothing was written: answer every question, or pass --yes to accept the defaults.';

// Ctrl+C on purpose, told apart by `error.code` the way a filesystem error already is.
export const RUN_CANCELLED_MESSAGE = 'Cancelled: nothing was written.';

// A radio, not a yes/no: a target that comes to offer two stores names both here. The persisted answer stays boolean.
export const STORE_CHOICES = ['store', 'none'] as const;

// Every key `ANSWERS` has, read off the object itself rather than a hand-kept list.
export const ANSWER_KEYS = valuesOf(ANSWERS);
