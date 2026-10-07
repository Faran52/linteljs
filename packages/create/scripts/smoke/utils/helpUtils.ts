import assert from 'node:assert/strict';

import { FLAGS, STAGES } from '../constants.ts';

export const assertHelp = (help: string): void => {
  for (const flag of FLAGS) {
    assert.match(help, new RegExp(`${flag}(?![\\w-])`), `--help does not mention ${flag}`);
  }

  for (const stage of STAGES) {
    assert.match(help, new RegExp(`\\b${stage}\\b`), `--help does not mention the ${stage} stage`);
  }

  assert.match(help, /@linteljs\/create sync/, '--help does not mention the sync command');
};
