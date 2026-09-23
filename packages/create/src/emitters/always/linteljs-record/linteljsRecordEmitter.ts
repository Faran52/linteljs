import { type Emitter } from '@config/types';

import { ANSWERS, type Answers } from '@answers';
import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';
import { VERSIONS } from '../package-json/constants';

import { answerRows, stackRows } from './utils/recordUtils';

/**
 * What the starter's Version page renders, written rather than read.
 *
 * Two of the rows cannot be read at runtime at all: a browser does not know its machine's Node or package manager,
 * and this CLI records both off the host that ran it. The rest could be read from `package.json`, which carries
 * ranges rather than resolved versions, so a build-time import would cost `resolveJsonModule` and two per-target
 * exceptions to restate a literal. Seeded rather than built, so a project owns it from its first run.
 */
export const emitLinteljsRecord = (answers: Answers, name: string): string => {
  const rows = (entries: [string, string][]): string => {
    return entries.map(([left, right]) => {
      return `  {\n    ${left},\n    ${right},\n  },`;
    }).join('\n');
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

export const linteljsRecordEmitter: Emitter = (answers, _project, name) => {
  const { recordModule } = targetFor(answers);

  return [emitted('standard', recordModule, emitLinteljsRecord(answers, name))];
};
