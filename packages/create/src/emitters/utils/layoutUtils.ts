import { posix } from 'node:path';

import { pick } from 'es-toolkit';

import { RUN_PREFIX } from '@config/constants';

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
  PackageManager,
} from '@config/types';

export const rootNameOf = (name: string): string => {
  return `${name}-workspace`;
};

// Measured on each manager: every one leaves the root out and skips a workspace without the script.
const workspacesCheck = (manager: PackageManager, rootName: string): string => {
  const commands: Record<PackageManager, string> = {
    pnpm: 'pnpm -r --if-present run check',
    npm: 'npm run check --workspaces --if-present',
    yarn: `yarn workspaces foreach -A --exclude ${rootName} run check`,
    bun: 'bun run --workspaces --if-present check',
  };

  return commands[manager];
};

// A monorepo root's `check`: its own lint and typecheck, then every package's.
export const rootCheckOf = (manager: PackageManager, name: string): string => {
  const run = RUN_PREFIX[manager];
  const workspaces = workspacesCheck(manager, rootNameOf(name));

  return `${run} lint && ${run} typecheck && ${workspaces}`;
};

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
