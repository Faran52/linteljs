import { omit } from 'es-toolkit';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS, WORKSPACE_KEYS } from '@answers';

// Thrown by `cli.ts` before `ask`: nothing here can tell no terminal from a cancel.
export const NOTHING_ANSWERED_MESSAGE
  = 'Nothing was written: answer every question, or pass --yes to accept the defaults.';

export const RUN_CANCELLED_MESSAGE = 'Cancelled: nothing was written.';

export const ANSWER_KEYS = keysOf(ANSWERS);

// Asked for each project of a monorepo; the rest once, for the workspace.
export const PROJECT_KEYS = keysOf(omit(ANSWERS, WORKSPACE_KEYS));

// A typo like 100 is refused at the question.
export const MAX_PROJECTS = 20;

export const PROJECT_KINDS = {
  app: {
    label: 'App',
    hint: 'apps/<name>, on a framework',
  },
  package: {
    label: 'Package',
    hint: 'packages/<name>, TypeScript, no framework',
  },
} as const;
