import type { AnswerRecord } from '../../types';

export const nodeVersionAnswer = {
  key: 'nodeVersion',
  description: 'The Node that ran create, whose major pins the version the CI workflow sets up.',
  kind: 'text',
  pattern: String.raw`^\d+\.\d+\.\d+`,
} as const satisfies AnswerRecord;
