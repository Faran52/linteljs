import { env } from 'node:process';

import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import { targetCases } from '../matrix/matrix';
import { runE2eCase } from '../runner/runner';
import { afterAllCleanup, managersToRun } from '../utils/workspaceUtils';

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const MANAGERS = await managersToRun(env['E2E_PM']);
// `E2E_SHARD=2/4` runs every fourth case from the second, so CI splits one manager's cases across runners.
const [PART, PARTS] = (env['E2E_SHARD'] ?? '1/1')
  .split('/')
  .map(Number);

if (PART === undefined || PARTS === undefined || !(PART >= 1 && PART <= PARTS)) {
  throw new Error(`E2E_SHARD is ${env['E2E_SHARD'] ?? ''}, and is <part>/<parts> with 1 <= part <= parts`);
}

const CASES = TARGET_IDS
  .flatMap(targetCases)
  .filter(({ answers }) => {
    return MANAGERS.includes(answers.packageManager);
  })
  .filter((_case, index) => {
    return index % PARTS === PART - 1;
  });

const SHARD_TARGETS = TARGET_IDS
  .filter((target) => {
    return CASES
      .some(({ answers }) => {
        return answers.target === target;
      });
  });

describe.each(SHARD_TARGETS)('%s end-to-end', (target) => {
  afterAll(afterAllCleanup);

  const casesOfTarget = CASES
    .filter(({ answers }) => {
      return answers.target === target;
    });

  it.concurrent.each(casesOfTarget)('generates, installs and checks $label', runE2eCase, 600_000);
});
