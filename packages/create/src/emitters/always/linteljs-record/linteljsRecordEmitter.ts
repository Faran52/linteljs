import { RUN_PREFIX, SYNC_COMMAND } from '@config/constants';
import { type Emitter, type HostedAnswers } from '@config/types';

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

// A browser cannot read its machine's Node or package manager, so this CLI records them.
export const emitLinteljsRecord = (answers: HostedAnswers, name: string): string => {
  const rows = (entries: [string, string][]): string => {
    return entries
      .map(([left, right]) => {
        return `  {\n    ${left},\n    ${right},\n  },`;
      })
      .join('\n');
  };

  const gate = rows(gateRows(answers));
  const stack = rows(stackRows(answers, VERSIONS));
  const recorded = rows(answerRows(answers, ANSWERS));
  const source = [
    '// Written once by @linteljs/create. Yours from here; only the starter pages read it.',
    nameDeclaration(name),
    '',
    `export const CHECK = '${RUN_PREFIX[answers.packageManager]} check';`,
    '',
    `export const SYNC = '${SYNC_COMMAND[answers.packageManager]}';`,
    '',
    'export const GATE = [',
    gate,
    '] as const;',
    '',
    'export const STACK = [',
    stack,
    '] as const;',
    '',
    'export const ANSWERS = [',
    recorded,
    '] as const;',
    '',
  ].join('\n');

  return source;
};

const RECORD_MODULE = 'src/config/linteljs.ts';

export const linteljsRecordEmitter: Emitter = (answers, _project, name) => {
  if (targetFor(answers).libraryProject === true) {
    return [];
  }

  const record = emitLinteljsRecord(answers, unscopedName(name));
  const artifacts = [emitted('standard', RECORD_MODULE, record)];

  return artifacts;
};
