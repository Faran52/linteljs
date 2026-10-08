import { posix } from 'node:path';

import { pick } from 'es-toolkit';

import { RUN_PREFIX } from '@config/constants';

import { DEFAULT_ANSWERS, WORKSPACE_KEYS } from '@answers';

import {
  PACKAGE_ANSWERS,
  ROOT_DIRECTORIES,
  ROOT_FILES,
} from '../constants';

import type {
  Artifact,
  HostedAnswers,
  PackageManager,
  Workspace,
  WorkspaceProject,
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

export const atRoot = (path: string): boolean => {
  return ROOT_FILES.includes(path) || ROOT_DIRECTORIES
    .some((directory) => {
      return path.startsWith(directory);
    });
};

export const inProject = (directory: string, artifacts: Artifact[]): Artifact[] => {
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

// The one place the workspace answers are set, so no project can disagree with the root.
export const workspaceOf = (name: string, projects: [WorkspaceProject, ...WorkspaceProject[]]): Workspace => {
  const [first, ...rest] = projects;
  const shared = pick(first.answers, WORKSPACE_KEYS);
  const others = rest
    .map((project) => {
      const answers = { ...project.answers, ...shared };
      const aligned = { ...project, answers };

      return aligned;
    });

  const workspace: Workspace = {
    name,
    projects: [first, ...others],
  };

  return workspace;
};

// `sync --add`: a TypeScript package on the workspace's manager, Node and type safety.
export const packageAnswersOf = (answers: HostedAnswers): HostedAnswers => {
  const project: HostedAnswers = {
    ...DEFAULT_ANSWERS,
    ...pick(answers, PACKAGE_ANSWERS),
    target: 'typescript',
    layout: 'monorepo',
  };

  return project;
};
