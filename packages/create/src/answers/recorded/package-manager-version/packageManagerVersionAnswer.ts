import type { AnswerRecord } from '../../types';

// Never asked: what `<pm> --version` answered on the host that ran create.
export const packageManagerVersionAnswer = {
  key: 'packageManagerVersion',
  description: 'The exact version of the package manager that ran create, written into the packageManager field of '
    + 'the generated package.json.',
  kind: 'text',
  pattern: String.raw`^\d+\.\d+\.\d+`,
} as const satisfies AnswerRecord;
