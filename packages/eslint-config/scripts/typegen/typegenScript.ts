// Writes `src/typegen.d.ts` from every plugin `linteljs()` can load, and fails when that changed the committed file.
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { builtinRules } from 'eslint/use-at-your-own-risk';
import { flatConfigsToRulesDTS } from 'eslint-typegen/core';

import { log, logError } from '../../../create/templates/project/scripts/utils/loggerUtils.ts';
import { linteljs } from '../../src/linteljs/linteljs.ts';

import type { LinteljsOptions } from '../../src/types.ts';

const path = resolve(import.meta.dirname, '../../src/typegen.d.ts');
// Every plugin across as few calls as the exclusive options allow.
const optionSets: LinteljsOptions[] = [
  {
    framework: 'astro',
    islands: [
      'react',
      'vue',
      'solid',
      'svelte',
      'angular',
    ],
    testing: 'vitest',
    e2e: 'playwright',
    stories: 'storybook',
    router: 'tanstack-router',
    data: 'tanstack-query',
    styling: 'tailwind',
    html: true,
  },
  {
    framework: 'next',
    testing: 'jest',
    styling: 'stylex',
  },
  { framework: 'nuxt' },
  { framework: 'expo' },
];
const composed = await Promise.all(optionSets
  .map((options) => {
    return linteljs(options);
  }));
const configs = composed.flat();
const core = { plugins: { '': { rules: Object.fromEntries(builtinRules) } } };

const dts = await flatConfigsToRulesDTS([core, ...configs], {
  includeAugmentation: false,
  includeIgnoreComments: false,
});
const previous = existsSync(path) ? readFileSync(path, 'utf8') : undefined;

writeFileSync(path, dts);

if (dts === previous) {
  log('src/typegen.d.ts is current');
}
else {
  logError('src/typegen.d.ts was stale and is regenerated: commit it');
  process.exitCode = 1;
}
