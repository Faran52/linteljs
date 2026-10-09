import { join, posix } from 'node:path';

import { ESLINT_CONFIG_PATH } from '@config/constants';

import { type DependencyDrift, type Upgrade } from '@emitters';
import {
  type LintConfigPlan,
  runnerSwitch,
  type SyncPlan,
  writeDependencies,
  writeLintConfig,
} from '@pipeline';

import { confirm, type Prompter } from '../../prompts/prompts';
import { SYNC_NEEDS_YES } from '../constants';

import { say, upgradeTable } from './reportUtils';

import type { HostedAnswers } from '@config/types';

export interface Asker {
  isYes: boolean;
  prompter: Prompter;
  hasTerminal: boolean;
}

interface DependencyStep {
  changes: Upgrade[];
  heading: string;
  question: string;
  done: string;
}

// `directory` is `.` for the root, and prefixes every line about the project.
export interface SyncedProject {
  directory: string;
  answers: HostedAnswers;
  plan: SyncPlan;
}

// `--yes` accepts; with no terminal it is null: the step writes nothing and the run fails, so a script notices.
const stepOf = async (asker: Asker, heading: string, question: string): Promise<boolean | null> => {
  say(heading);

  if (asker.isYes) {
    return true;
  }

  if (!asker.hasTerminal) {
    console.error(SYNC_NEEDS_YES);

    return null;
  }

  return await confirm(asker.prompter, question);
};

const prefixOf = (directory: string): string => {
  return directory === '.' ? '' : `${directory}: `;
};

// Each step resolves to whether it was blocked.
const dependencyStep = async (cwd: string, asker: Asker, step: DependencyStep): Promise<boolean> => {
  const {
    changes,
    heading,
    question,
    done,
  } = step;

  if (changes.length === 0) {
    return false;
  }

  const isApproved = await stepOf(asker, `${heading}\n${upgradeTable(changes)}`, question);

  if (isApproved === true) {
    await writeDependencies(cwd, changes);
    say(done);
  }

  return isApproved === null;
};

// A missing config is written; one the project has is moved aside only when asked.
export const lintConfigStep = async (cwd: string, asker: Asker, project: SyncedProject): Promise<boolean> => {
  const {
    directory,
    answers,
    plan,
  } = project;
  const root = join(cwd, directory);
  const config = posix.join(directory, ESLINT_CONFIG_PATH);

  if (plan.eslintConfig.status !== 'changed') {
    if (plan.eslintConfig.status === 'missing') {
      await writeLintConfig(root, answers, plan.eslintConfig);
      say(`wrote ${config}`);
    }

    return false;
  }

  const lintPlan: LintConfigPlan = plan.eslintConfig;
  const path = posix.join(directory, lintPlan.path);
  const backup = posix.join(directory, lintPlan.backup);
  const question = `${prefixOf(directory)}Move it to ${backup} and write ${config}?`;
  const isApproved = await stepOf(asker, `${path} differs from the config linteljs writes.`, question);

  if (isApproved === true) {
    await writeLintConfig(root, answers, lintPlan);
    say(`moved ${path} to ${backup}, wrote ${config}`);
  }

  return isApproved === null;
};

// The upgrades, then the lint peers, each asked on its own.
export const dependencySteps = async (
  cwd: string,
  asker: Asker,
  directory: string,
  drift: DependencyDrift,
  packageManager: string,
): Promise<boolean[]> => {
  const prefix = prefixOf(directory);
  const manifest = posix.join(directory, 'package.json');
  const upgradeStep: DependencyStep = {
    changes: drift.upgrades,
    heading: `${prefix}@linteljs/* versions behind:`,
    question: `${prefix}Update them in package.json?`,
    done: `wrote ${manifest}`,
  };
  const peerStep: DependencyStep = {
    changes: drift.peers,
    heading: `${prefix}Lint dependencies missing or behind:`,
    question: `${prefix}Add or update them in package.json?`,
    done: `wrote ${manifest}. Install them:\n  ${packageManager} install`,
  };
  const root = join(cwd, directory);
  const isUpgradeBlocked = await dependencyStep(root, asker, upgradeStep);
  const isPeerBlocked = await dependencyStep(root, asker, peerStep);

  const blocked = [isUpgradeBlocked, isPeerBlocked];

  return blocked;
};

export const isSettled = (drift: DependencyDrift): boolean => {
  return drift.upgrades.length === 0 && drift.peers.length === 0;
};

// The suites, setup and scripts a runner reads are each project's own, so any switch writes nothing.
export const switchRefusal = async (cwd: string, synced: SyncedProject[]): Promise<string | undefined> => {
  for (const { directory, answers } of synced) {
    const switched = await runnerSwitch(join(cwd, directory), answers);

    if (switched !== null) {
      const { from, to } = switched;
      const refusal = [
        `${prefixOf(directory)}Nothing was written: this project runs its suites on ${from},`,
        `and linteljs now runs them on ${to}.`,
        'sync changes no runner, since the suites, setup and test scripts are the project\'s.',
        `Port them to ${to}, swap the dependencies, and run sync again.`,
      ].join(' ');

      return refusal;
    }
  }

  return undefined;
};
