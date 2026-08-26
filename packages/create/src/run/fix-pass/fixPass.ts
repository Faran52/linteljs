import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { RUN_PREFIX, styleGlob } from '../../artifacts/build-scripts/buildScripts';

import type { Answers } from '../../model/answers/answers';

interface EslintFixResult {
  // Present exactly when the file was fixed.
  output?: string;
}

// What the user has to run themselves when the fix pass could not.
export const nextStep = (answers: Answers): string => {
  return `next: ${answers.packageManager} install && ${RUN_PREFIX[answers.packageManager]} lint:fix`;
};

// With `--fix`, eslint reports a fixed file's rewritten source under `output`, so counting that field needs no separate
// dry run.
const parseFixReport = (stdout: string): number => {
  try {
    const parsed: unknown = JSON.parse(stdout);

    if (!Array.isArray(parsed)) {
      return 0;
    }

    return parsed.filter((result: EslintFixResult) => {
      return result.output !== undefined;
    }).length;
  }
  catch {
    // A formatter that emitted nothing parseable is not worth failing a generate over.
    return 0;
  }
};

// Silent about its count, unlike the eslint pass: stylelint's JSON report names files rather than which it rewrote.
const fixStyles = (cwd: string, answers: Answers, report: (message: string) => void): void => {
  const binary = join(cwd, 'node_modules', '.bin', 'stylelint');

  if (!existsSync(binary)) {
    return;
  }

  const result = spawnSync(binary, [styleGlob(answers), '--fix', '--allow-empty-input'], {
    cwd,
    encoding: 'utf8',
  });

  if (result.error !== undefined) {
    report('stylelint --fix could not run; run it yourself once dependencies are installed');
  }
};

// Never fatal: `--fix` exiting 1 on remaining findings is normal, and a missing eslint reports a next step instead of
// failing the generate.
export const runFixPass = (
  cwd: string,
  answers: Answers,
  onNotice?: (message: string) => void,
): void => {
  const report = onNotice ?? (() => {
    return undefined;
  });
  const binary = join(cwd, 'node_modules', '.bin', 'eslint');

  if (!existsSync(binary)) {
    report(nextStep(answers));
    return;
  }

  const result = spawnSync(binary, ['.', '--fix', '--format', 'json'], {
    cwd,
    encoding: 'utf8',
  });

  // Exit 2 is a configuration failure, and the config is ours. Anything else means eslint ran.
  if (result.error !== undefined || result.status === 2) {
    report('eslint --fix could not run; run it yourself once dependencies are installed');
    return;
  }

  const fixed = parseFixReport(result.stdout);
  const files = `${String(fixed)} file${fixed === 1 ? '' : 's'}`;

  report(fixed === 0 ? 'eslint --fix: nothing to fix' : `eslint --fix: ${files} changed`);

  fixStyles(cwd, answers, report);
};
