import { RUN_PREFIX, SYNC_COMMAND } from '@config/constants';
import {
  type Emitter,
  type HostedAnswers,
  type PackageManager,
} from '@config/types';

import { unscopedName } from '@utils/nameUtils';

import { ANSWERS } from '@answers';
import { targetFor } from '@targets';

import { VERSIONS } from '../../constants';
import { emitted } from '../../utils/artifactUtils';

import {
  answerRows,
  gateRows,
  nameDeclaration,
  stackRows,
} from './utils/recordUtils';

interface RecordParts {
  name: string;
  packageManager: PackageManager;
  gate: [string, string][];
  stack: [string, string][];
  answers: [string, string][];
}

// A browser cannot read its machine's Node or package manager, so this CLI records them.
export const emitLinteljsRecord = (answers: HostedAnswers, name: string): string => {
  return linteljsRecordSource({
    name,
    packageManager: answers.packageManager,
    gate: gateRows(answers),
    stack: stackRows(answers, VERSIONS),
    answers: answerRows(answers, ANSWERS),
  });
};

const rowsOf = (entries: [string, string][]): string => {
  return entries
    .map(([left, right]) => {
      return `  {\n    ${left},\n    ${right},\n  },`;
    })
    .join('\n');
};

const linteljsRecordSource = (parts: RecordParts): string => {
  const source = [
    '// Written once by @linteljs/create. Yours from here; only the starter pages read it.',
    nameDeclaration(parts.name),
    '',
    `export const CHECK = '${RUN_PREFIX[parts.packageManager]} check';`,
    '',
    `export const SYNC = '${SYNC_COMMAND[parts.packageManager]}';`,
    '',
    'export const GATE = [',
    rowsOf(parts.gate),
    '] as const;',
    '',
    'export const STACK = [',
    rowsOf(parts.stack),
    '] as const;',
    '',
    'export const ANSWERS = [',
    rowsOf(parts.answers),
    '] as const;',
    '',
  ].join('\n');

  return source;
};

const RECORD_MODULE = 'src/config/linteljs.ts';

export const linteljsRecordEmitter: Emitter = (answers, _project, name) => {
  if (targetFor(answers).packageProject === true) {
    return [];
  }

  const record = emitLinteljsRecord(answers, unscopedName(name));
  const artifacts = [emitted('standard', RECORD_MODULE, record)];

  return artifacts;
};
