import { type Answers, type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { merged } from '../../utils/artifactUtils';

import {
  BASE_IGNORED,
  HEADING,
  YARN_IGNORED,
} from './constants';

export const mergeGitignore = (existing: string | null, entries: string[]): string => {
  const current = existing ?? '';
  // Either line ending, or a Windows checkout's trailing `\r` gets the entry appended again.
  const lines = current.split(/\r?\n/);

  const isNegation = (entry: string): boolean => {
    return entry.startsWith('!');
  };

  const isAppended = (entry: string): boolean => {
    return !isNegation(entry) && !lines.includes(entry);
  };

  // Last match wins, so a negation our list orders after an appended pattern goes again after it. By list
  // order, not glob matching: repeating a negation the new pattern never matches is harmless.
  const missing = entries
    .filter((entry, index) => {
      return !lines.includes(entry) || (isNegation(entry) && entries
        .slice(0, index)
        .some(isAppended));
    });

  if (missing.length === 0) {
    return current;
  }

  const block = `${HEADING}\n${missing.join('\n')}\n`;

  if (current === '') {
    return block;
  }

  const terminated = current.endsWith('\n') ? current : `${current}\n`;

  return `${terminated}\n${block}`;
};

export const gitignoreEmitter = (answers: Answers): Artifact[] => {
  const entries = [
    ...BASE_IGNORED,
    ...answers.packageManager === 'yarn' ? YARN_IGNORED : [],
    ...targetFor(answers).gitignore,
  ];
  const artifacts = [
    merged('package', '.gitignore', (existing) => {
      return mergeGitignore(existing, entries);
    }),
  ];

  return artifacts;
};
