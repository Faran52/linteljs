import type { AnswerRecord } from '../../types';

// For a generated file the project commits; build outputs are already in `.gitignore`.
export const ignoresAnswer = {
  key: 'ignores',
  description: 'Paths this project lints nothing in, beyond the standard list. Not for build outputs: base() '
    + 'already ignores whatever .gitignore does. This is for what that file cannot name, such as a generated file '
    + 'the project commits.',
  kind: 'list',
} as const satisfies AnswerRecord;
