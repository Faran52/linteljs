import { env } from 'node:process';

import {
  afterAll,
  describe,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

import { shardOf, targetCases } from '../matrix/matrix';
import { runE2eCase } from '../runner/runner';
import { afterAllCleanup } from '../utils/workspaceUtils';

const TARGET_IDS = valuesOf(ANSWERS.target.values);

// Every shard is its own machine in `e2e.yml`, and each starts its own registry on the same fixed port.
const CASES = shardOf(
  TARGET_IDS.flatMap(targetCases),
  Number(env['E2E_SHARD'] ?? '1'),
  Number(env['E2E_SHARDS'] ?? '1'),
);

describe.each(TARGET_IDS)('%s end-to-end', (target) => {
  afterAll(afterAllCleanup);

  it.concurrent.each(CASES.filter(({ answers }) => {
    return answers.target === target;
  // A command's 300s, plus a wait behind one install of the same binary: the slowest measured case took 97s.
  }))('generates, installs and checks $label', runE2eCase, 600_000);
});
