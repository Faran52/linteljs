import { difference } from 'es-toolkit';

import { RUN_PREFIX } from '@config/constants';

import { parsedAs } from '@utils/objectUtils';

import { globSnapshot } from '@disk';
import { styleGlob } from '@emitters';
import { localBinarySpawn } from '@spawns';

import type { Answers } from '@config/types';

interface EslintFixResult {
  // Present exactly when the file was fixed.
  output?: string;
}

// Counted by content: stylelint's JSON report names files, not which it rewrote.
type BinarySpawn = (name: string, args: string[]) => ReturnType<typeof localBinarySpawn>;

export const nextStep = (answers: Answers): string => {
  return `next: ${answers.packageManager} install && ${RUN_PREFIX[answers.packageManager]} lint:fix`;
};

const isFixReport = (value: unknown): value is EslintFixResult[] => {
  return Array.isArray(value);
};

// Unparseable formatter output counts nothing rather than failing a generate.
const parseFixReport = (stdout: string): number => {
  const report = parsedAs(stdout, isFixReport);

  return report === null
    ? 0
    : report
      .filter((result) => {
        return result.output !== undefined;
      }).length;
};

const changedFiles = (fixed: number, tool: string): string => {
  const files = `${String(fixed)} file${fixed === 1 ? '' : 's'}`;

  return fixed === 0 ? `${tool} --fix: nothing to fix` : `${tool} --fix: ${files} changed`;
};

const fixStyles = async (
  cwd: string,
  answers: Answers,
  report: (message: string) => void,
  binarySpawn: BinarySpawn,
): Promise<void> => {
  const glob = styleGlob(answers);
  const before = await globSnapshot(cwd, glob);
  const result = await binarySpawn('stylelint', [
    glob,
    '--fix',
    '--allow-empty-input',
  ]);

  if (result === null) {
    return;
  }

  if (result.failed) {
    report('stylelint --fix could not run; run it yourself once dependencies are installed');
    return;
  }

  const afterFix = await globSnapshot(cwd, glob);
  const changed = difference(before, afterFix);

  report(changedFiles(changed.length, 'stylelint'));
};

// Never fatal: exit 1 on remaining findings is normal.
export const fixPass = async (
  cwd: string,
  answers: Answers,
  onNotice?: (message: string) => void,
  installRoot = cwd,
): Promise<void> => {
  const report = (message: string): void => {
    onNotice?.(message);
  };

  // A workspace manager may hoist a workspace's binaries to the install root.
  const binarySpawn: BinarySpawn = async (name, args) => {
    const inApp = await localBinarySpawn(cwd, name, args);

    if (inApp !== null || installRoot === cwd) {
      return inApp;
    }

    return await localBinarySpawn(cwd, name, args, installRoot);
  };

  const result = await binarySpawn('eslint', [
    '.',
    '--fix',
    '--format',
    'json',
  ]);

  if (result === null) {
    report(nextStep(answers));
    return;
  }

  // Exit 2 is a configuration failure, and the config is ours.
  if (result.failed || result.status === 2) {
    report('eslint --fix could not run; run it yourself once dependencies are installed');
    return;
  }

  const fixed = parseFixReport(result.stdout);

  report(changedFiles(fixed, 'eslint'));

  await fixStyles(cwd, answers, report, binarySpawn);
};
