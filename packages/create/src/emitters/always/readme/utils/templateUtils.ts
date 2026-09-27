import { RUN_PREFIX } from '@config/constants';

import { hasTests } from '@utils/answerUtils';

import { ANSWERS } from '@answers';

import { buildScripts } from '../../utils/scriptUtils';

import type { Answers } from '@config/types';

// An unfilled slot throws: an intact `{{RUN}}` in a generated CLAUDE.md reads as documentation.

const SLOT_PATTERN = /\{\{[A-Z_]+\}\}/g;

const testRows = (answers: Answers, run: string): string => {
  return hasTests(answers)
    ? `| test | \`${run} test\` |\n| coverage | \`${run} test:coverage\` |\n`
    : '';
};

// Shared by CLAUDE.md and README.md, so a new slot is one edit.
export const sharedSlots = (projectName: string, answers: Answers): Record<string, string> => {
  const run = RUN_PREFIX[answers.packageManager];

  return {
    PROJECT_NAME: projectName,
    TARGET_LABEL: ANSWERS.target.values[answers.target].label,
    RUN: run,
    CHECK_CHAIN: buildScripts(answers).check,
    TEST_ROWS: testRows(answers, run),
  };
};

export const fillSlots = (
  template: string,
  values: Record<string, string>,
  label: string,
): string => {
  const filled = template
    .replace(SLOT_PATTERN, (slot) => {
      return values[slot.slice(2, -2)] ?? slot;
    });

  const unfilled = filled.match(SLOT_PATTERN);

  if (unfilled) {
    throw new Error(`${label} template has unfilled slots: ${unfilled.join(', ')}`);
  }

  return filled;
};
