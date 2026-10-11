import { omitBy } from 'es-toolkit';

import {
  ANSWERS,
  type ConfigEntry,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
  workspaceConfigOf,
} from '@answers';

import { type Answered } from '../../read/manifest/manifestReader';

interface AnsweredProject {
  name: string;
  answers: Answered;
}

// An optional choice answered none is left out as the reader spells it.
const entryOf = ({ name, answers }: AnsweredProject): ConfigEntry => {
  const recorded = omitBy(answers, (value, key) => {
    return value === 'none' && ANSWERS[key].kind === 'optionalChoice';
  });
  const flat = {
    ...DEFAULT_ANSWERS,
    ...recorded,
  };

  const entry: ConfigEntry = [flat, name];

  return entry;
};

// Unasked keys sit at their defaults, and the text is read back once so a record the reader refuses is never written.
export const configRecord = (projects: readonly [AnsweredProject, ...AnsweredProject[]]): string => {
  const [first, ...rest] = projects;
  const config = workspaceConfigOf([entryOf(first), ...rest.map(entryOf)]);
  const text = `${JSON.stringify(config, null, 2)}\n`;

  parseLinteljsConfig(text);

  return text;
};
