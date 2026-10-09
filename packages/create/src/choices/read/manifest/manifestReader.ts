import { join } from 'node:path';

import {
  isJsonObject,
  isValueOf,
  parsedAs,
} from '@utils/objectUtils';

import { type AnswerKey, ANSWERS } from '@answers';
import { readIfPresent, TEMPLATES_ROOT } from '@disk';

export interface Label {
  label: string;
  hint?: string;
}

export interface Value extends Label {
  // A literal, or `*` for any answer but none.
  requires?: Partial<Record<AnswerKey, string>>;
}

export type Answered = Partial<Record<AnswerKey, string | string[]>>;

export interface Question {
  key: AnswerKey;
  flag: string;
  prompt: string;
  kind: 'choice' | 'multi';
  scope: 'project' | 'workspace';
  default: string | string[];
  none?: Label;
  values: Record<string, Value>;
}

const isKind = (value: unknown): value is Question['kind'] => {
  return value === 'choice' || value === 'multi';
};

const isQuestion = (value: unknown): value is Question => {
  if (!isJsonObject(value) || !('key' in value) || !('kind' in value) || !('values' in value)) {
    return false;
  }

  return typeof value.key === 'string' && isValueOf(value.key, ANSWERS) && isKind(value.kind)
    && isJsonObject(value.values);
};

const isManifest = (value: unknown): value is Question[] => {
  return Array.isArray(value) && value.every(isQuestion);
};

export const manifestReader = async (root = TEMPLATES_ROOT): Promise<Question[]> => {
  const path = join(root, 'common', 'questions.json');
  const text = await readIfPresent(path);
  const questions = parsedAs(text, isManifest);

  if (questions === null) {
    throw new Error(`${path} is not a list of questions`);
  }

  return questions;
};
