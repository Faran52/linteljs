import {
  EXEC_PREFIX,
  RUN_PREFIX,
  SYNC_COMMAND,
} from '@config/constants';

import { appDirectoryOf, hasTests } from '@utils/answerUtils';

import { ANSWERS } from '@answers';

import { buildScripts } from '../../utils/scriptUtils';

import type { Answers, PackageManager } from '@config/types';

// An unfilled slot throws: an intact `{{RUN}}` in a generated CLAUDE.md reads as documentation.

const SLOT_PATTERN = /\{\{[A-Z_]+\}\}/g;

const SLOT_DELIMITER_LENGTH = '{{'.length;

const testRows = (answers: Answers, run: string): string => {
  return hasTests(answers)
    ? `| test | \`${run} test\` |\n| coverage | \`${run} test:coverage\` |\n`
    : '';
};

const filtered = (manager: PackageManager, name: string, script: string): string => {
  const commands: Record<PackageManager, string> = {
    pnpm: `pnpm --filter ${name} ${script}`,
    npm: `npm run ${script} -w ${name}`,
    yarn: `yarn workspace ${name} ${script}`,
    bun: `bun run --filter ${name} ${script}`,
  };

  return commands[manager];
};

// A monorepo's root holds only `lint`, `typecheck` and a `check` over every package; the rest live in the app.
const workspaceNote = (projectName: string, answers: Answers): string => {
  if (answers.layout === 'single') {
    return '';
  }

  const script = buildScripts(answers)['dev'] === undefined ? 'build' : 'dev';
  const command = filtered(answers.packageManager, projectName, script);

  const app = appDirectoryOf(answers, projectName);

  return `The app lives in \`${app}/\`, and every package carries these scripts. At the `
    + 'root, `lint` and `typecheck` cover the root\'s own `scripts/`, and `check` runs them, then every package\'s '
    + `\`check\`. Run any other script in its package's directory, or from the root: \`${command}\`.\n\n`;
};

export const sharedSlots = (projectName: string, answers: Answers): Record<string, string> => {
  const run = RUN_PREFIX[answers.packageManager];

  const slots: Record<string, string> = {
    PROJECT_NAME: projectName,
    TARGET_LABEL: ANSWERS.target.values[answers.target].label,
    RUN: run,
    EXEC: EXEC_PREFIX[answers.packageManager],
    SYNC: SYNC_COMMAND[answers.packageManager],
    CHECK_CHAIN: buildScripts(answers).check,
    TEST_ROWS: testRows(answers, run),
    WORKSPACE: workspaceNote(projectName, answers),
  };

  return slots;
};

export const fillSlots = (
  template: string,
  values: Record<string, string>,
  label: string,
): string => {
  const filled = template
    .replace(SLOT_PATTERN, (slot) => {
      return values[slot.slice(SLOT_DELIMITER_LENGTH, -SLOT_DELIMITER_LENGTH)] ?? slot;
    });

  const unfilled = filled.match(SLOT_PATTERN);

  if (unfilled) {
    throw new Error(`${label} template has unfilled slots: ${unfilled.join(', ')}`);
  }

  return filled;
};
