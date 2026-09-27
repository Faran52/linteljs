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
const CASES = TARGET_IDS
  .flatMap(targetCases)
  .filter(({ answers }) => {
    return MANAGERS.includes(answers.packageManager);
  });

describe.each(TARGET_IDS)('%s end-to-end', (target) => {
  afterAll(afterAllCleanup);

  const casesOfTarget = CASES
    .filter(({ answers }) => {
      return answers.target === target;
    });

  it.concurrent.each(casesOfTarget)('generates, installs and checks $label', runE2eCase, 600_000);
});
