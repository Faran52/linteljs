import { env } from 'node:process';

import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { ANSWERS } from '#answers';
import { valuesOf } from '#utils/objectUtils';

import { targetCases } from '../matrix/matrix';
import { runE2eCase } from '../runner/runner';
import { afterAllCleanup, managersToRun } from '../utils/workspaceUtils';

const TARGET_IDS = valuesOf(ANSWERS.target.values);

// Every job in `e2e.yml` is one manager on its own machine, and each starts its own registry on the same fixed port.
const MANAGERS = await managersToRun(env['E2E_PM']);
const CASES = TARGET_IDS.flatMap(targetCases).filter(({ answers }) => {
  return MANAGERS.includes(answers.packageManager);
});

describe.each(TARGET_IDS)('%s end-to-end', (target) => {
  afterAll(afterAllCleanup);

  it.concurrent.each(CASES.filter(({ answers }) => {
    return answers.target === target;
  // A command's 300s, plus a wait behind one install of the same binary: the slowest measured case took 97s.
  }))('generates, installs and checks $label', runE2eCase, 600_000);
});
