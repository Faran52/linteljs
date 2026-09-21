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

/**
 * What clack writes once a question is answered: its submitted symbol, two spaces, the message, a newline, then what
 * was chosen. Matched to join the two into one line and to trade the symbol for the tick the stages use, so a run
 * reads as one list. A terminal without unicode gets clack's `o` instead and keeps the two-line shape, which reads
 * the same, only taller.
 */
export const ANSWERED_PREFIX = '\u25C7  ';

// Replaces it, the same width, and the same mark a finished stage carries.
export const ANSWERED_MARK = '\u2713  ';

// What the name question shows while it is being typed, in the place clack would put its own active symbol.
export const ASKING_MARK = '\u25C6  ';

// The gap the answer sits behind its question on, the same one the stage lines use.
export const ANSWER_GAP = '  ';
