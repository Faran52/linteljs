import { type Emitter, type HostedAnswers } from '@config/types';

import { ANSWERS } from '@answers';

import { VERSIONS } from '../../constants';
import { emitted } from '../../utils/artifactUtils';

import { answerRows, stackRows } from './utils/recordUtils';

// A browser cannot read its machine's Node or package manager, so this CLI records them.
export const emitLinteljsRecord = (answers: HostedAnswers, name: string): string => {
  const rows = (entries: [string, string][]): string => {
    return entries
      .map(([left, right]) => {
        return `  {\n    ${left},\n    ${right},\n  },`;
      })
      .join('\n');
  };

  return [
    '// Written once by @linteljs/create. Yours from here; the starter Version page is its only reader.',
    `export const NAME = '${name}';`,
    '',
    'export const STACK = [',
    rows(stackRows(answers, VERSIONS)),
    '] as const;',
    '',
    'export const ANSWERS = [',
    rows(answerRows(answers, ANSWERS)),
    '] as const;',
    '',
  ].join('\n');
};

export const RECORD_MODULE = 'src/config/linteljs.ts';

export const linteljsRecordEmitter: Emitter = (answers, _project, name) => {
  return [emitted('standard', RECORD_MODULE, emitLinteljsRecord(answers, name))];
};
