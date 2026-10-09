import { omit } from 'es-toolkit';

import {
  type Answers,
  type Artifact,
  type Workspace,
} from '@config/types';

import { keysOf } from '@utils/objectUtils';

import {
  type AnswerKey,
  type AnswerRecord,
  ANSWERS,
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  workspaceConfigOf,
} from '@answers';
import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// An unasked answer still holds its default in `Answers`; the reader restores it, so the file leaves it out.
interface NamedAnswers {
  name: string;
  answers: Answers;
}

const unaskedKeys = (answers: Answers): AnswerKey[] => {
  const target = targetFor(answers);

  return keysOf(ANSWERS)
    .filter((key: AnswerKey) => {
      const record: AnswerRecord = ANSWERS[key];

      return record.slot?.(target) === false;
    });
};

// Several projects record the workspace answers once, from the first, and each project's own under `projects`.
export const emitWorkspaceConfig = (projects: readonly NamedAnswers[]): string => {
  const entries = projects
    .map(({ name, answers }) => {
      const asked = omit(answers, unaskedKeys(answers));
      const entry = [asked, name] as const;

      return entry;
    });
  const config = {
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...workspaceConfigOf(entries),
  };
  const json = JSON.stringify(config, null, 2);

  return `${json}\n`;
};

export const emitLinteljsConfig = (answers: Answers, name: string): string => {
  return emitWorkspaceConfig([{ name, answers }]);
};

// Written by `sync` only on `--add`, so a reformatted config survives `sync`.
// Seeded first, so a run that dies before `package.json` leaves the answers recorded.
export const linteljsConfigEmitter = (workspace: Workspace): Artifact[] => {
  const config = emitWorkspaceConfig(workspace.projects);
  const artifacts = [emitted('package', CONFIG_PATH, config)];

  return artifacts;
};
