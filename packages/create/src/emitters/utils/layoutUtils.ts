import { posix } from 'node:path';

import { pick } from 'es-toolkit';

import { appDirectoryOf } from '@utils/answerUtils';

import { DEFAULT_ANSWERS } from '@answers';

import {
  LIBRARY_ANSWERS,
  ROOT_DIRECTORIES,
  ROOT_FILES,
} from '../constants';

import type {
  Answers,
  Artifact,
  HostedAnswers,
} from '@config/types';

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

// `sync --add`: a TypeScript library on the workspace's manager, Node and type safety.
export const libraryAnswersOf = (answers: HostedAnswers): HostedAnswers => {
  const library: HostedAnswers = {
    ...DEFAULT_ANSWERS,
    ...pick(answers, LIBRARY_ANSWERS),
    target: 'typescript',
    layout: 'monorepo',
  };

  return library;
};

// Only what lands in the app's directory is the package's: the root tooling is the workspace's already.
export const inPackage = (answers: Answers, name: string, artifacts: Artifact[]): Artifact[] => {
  const from = `${appDirectoryOf(answers, name)}/`;
  const to = `packages/${name}/`;

  const move = (path: string): string => {
    return path.startsWith(from) ? `${to}${path.slice(from.length)}` : path;
  };

  const moved = artifacts
    .filter(({ target }) => {
      return target.startsWith(from);
    })
    .map((artifact) => {
      const target = move(artifact.target);
      const movedArtifact = { ...artifact, target };

      if (artifact.requires === undefined) {
        return movedArtifact;
      }

      const requires = artifact.requires.map(move);
      const movedWithRequires = { ...movedArtifact, requires };

      return movedWithRequires;
    });

  return moved;
};
