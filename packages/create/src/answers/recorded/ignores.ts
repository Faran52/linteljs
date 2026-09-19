import type { AnswerRecord } from '../record';

// Never asked: paths this project lints nothing in. Not for build outputs, which `.gitignore` already covers: for
// a generated file the project commits.
export const ignores = {
  key: 'ignores',
  description: 'Paths this project lints nothing in, beyond the standard list. Not for build outputs: base() '
    + 'already ignores whatever .gitignore does. This is for what that file cannot name, such as a generated file '
    + 'the project commits.',
  kind: 'list',
} as const satisfies AnswerRecord;
