import { posix } from 'node:path';

import { appDirectoryOf } from '@utils/answerUtils';

import { ROOT_DIRECTORIES, ROOT_FILES } from '../constants';

import type { Answers, Artifact } from '@config/types';

const atRoot = (path: string): boolean => {
  return ROOT_FILES.includes(path) || ROOT_DIRECTORIES
    .some((directory) => {
      return path.startsWith(directory);
    });
};

export const inLayout = (answers: Answers, name: string, artifacts: Artifact[]): Artifact[] => {
  const directory = appDirectoryOf(answers, name);

  if (directory === '.') {
    return artifacts;
  }

  const rebase = (path: string): string => {
    return atRoot(path) ? path : posix.join(directory, path);
  };

  const rebased = artifacts
    .map((artifact) => {
      const target = rebase(artifact.target);
      const moved = { ...artifact, target };

      if (artifact.requires === undefined) {
        return moved;
      }

      const requires = artifact.requires.map(rebase);
      const movedWithRequires = { ...moved, requires };

      return movedWithRequires;
    });

  return rebased;
};
