import type { AnswerRecord } from '../types';

// Never asked: a fact about a project's dependencies, edited into `linteljs.config.json` by hand when one needs it.
export const resolveConditions = {
  key: 'resolveConditions',
  kind: 'list',
} as const satisfies AnswerRecord;
