import { difference } from 'es-toolkit';

import { type Artifact } from '@config/types';

import { merged } from '../../utils/artifactUtils';
// Appended: the scaffolder's list knows about `.next/` and `.svelte-kit/`.

const LINTEL_IGNORED = ['coverage/', '*.tsbuildinfo'];

const HEADING = '# linteljs';

export const mergeGitignore = (existing: string | null): string => {
  const current = existing ?? '';
  // Either line ending, or a Windows checkout's trailing `\r` gets the entry appended again.
  const lines = current.split(/\r?\n/);

  const missing = difference(LINTEL_IGNORED, lines);

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

export const gitignoreEmitter = (): Artifact[] => {
  const artifacts = [merged('package', '.gitignore', mergeGitignore)];

  return artifacts;
};
