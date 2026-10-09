import { omitBy } from 'es-toolkit';

import {
  ANSWERS,
  CONFIG_SCHEMA_URL,
  type ConfigEntry,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  parseLinteljsConfig,
  workspaceConfigOf,
} from '@answers';

import { type Answered } from '../../read/manifest/manifestReader';

interface AnsweredProject {
  name: string;
  answers: Answered;
}

// Unasked keys sit at their defaults, an optional choice answered none is left out as the reader spells it, and the
// text is read back once so a record the reader refuses is never written.
export const configRecord = (projects: readonly AnsweredProject[]): string => {
  const entries = projects
    .map(({ name, answers }) => {
      const recorded = omitBy(answers, (value, key) => {
        return value === 'none' && ANSWERS[key].kind === 'optionalChoice';
      });
      const flat = {
        ...DEFAULT_ANSWERS,
        ...recorded,
      };

      const entry: ConfigEntry = [flat, name];

      return entry;
    });
  const config = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...workspaceConfigOf(entries),
  };
  const text = `${JSON.stringify(config, null, 2)}\n`;

  parseLinteljsConfig(text);

  return text;
};
