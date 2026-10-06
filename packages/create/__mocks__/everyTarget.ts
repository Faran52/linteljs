import { keysOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import { targetFor } from '@targets';

import { answersFor } from './answersFor';

import type { Answers } from '@config/types';

type Row = [label: string, answers: Answers];

// Every target, and each framework a hosting target can carry.
export const everyTarget = (): Row[] => {
  const rows = keysOf(ANSWERS.target.values)
    .flatMap((target) => {
      const answers = answersFor({ target });
      const hosted = targetFor(answers).hostsFramework === true ? keysOf(ANSWERS.hostedFramework.values) : [];
      const plain: Row = [target, answers];
      const framed = hosted
        .map((hostedFramework) => {
          const label = `${target}+${hostedFramework}`;
          const row: Row = [label, answersFor({ target, hostedFramework })];

          return row;
        });

      const targetRows = [plain, ...framed];

      return targetRows;
    });

  return rows;
};
