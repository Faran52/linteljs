import { stdout } from 'node:process';

import { log, spinner } from '@clack/prompts';

import { STAGES } from '@config/constants';
import { type Stage } from '@config/types';

import {
  INHERITED_STAGES,
  STAGE_LABELS,
  STAGE_WIDTH,
} from '../constants';

import type { PipelineOptions } from '@pipeline';
import type { CliOptions } from './argvUtils';

export type StageReport = Required<Pick<PipelineOptions,
  'onNotice'
  | 'onStage'
  | 'onStageDone'
  | 'onWrite'
>>;

// stdout for what the user asked to see; `console.error` for failures.
export const say = (message: string): void => {
  stdout.write(`${message}\n`);
};

/**
 * What a stage says on its own line: how many files it wrote, or the last thing it said where it wrote none, since
 * the scaffolder and the install write their own files and only speak. The time is absent while the stage is still
 * running, which is what the spinner carries, and present once it has finished.
 */
export const stageLine = (stage: Stage, writes: number, notice: string, milliseconds?: number): string => {
  const files = writes === 1 ? 'file' : 'files';
  const wrote = writes > 0 ? `${String(writes)} ${files}` : notice;
  const took = milliseconds === undefined ? '' : `${(milliseconds / 1000).toFixed(1)}s`;

  const summary = [wrote, took].filter((part) => {
    return part !== '';
  }).join(', ');

  return `${stage.padEnd(STAGE_WIDTH)}  ${summary}`.trimEnd();
};

// The stages this run will execute, before the first one starts: a stage that is skipped is easier to read here
// than to notice missing from the numbered lines underneath.
export const stepsPlan = (options: CliOptions): string => {
  const lines = STAGES.map((stage, index) => {
    // The rule `pipelineRun` applies: with lint skipped there is nothing of ours to fix against.
    const skipped = options.skip.includes(stage) || (stage === 'fix' && options.skip.includes('lint'));

    return `  ${String(index + 1)}. ${STAGE_LABELS[stage]}${skipped ? ' (skipped)' : ''}`;
  });

  return ['', 'Steps:', ...lines].join('\n');
};

// Behind a pipe every event is its own line, under a plan of what is coming: it is what a CI log carries and what
// the end-to-end suite reads. The plan is printed as the reporter is built, which is before the first stage runs.
const pipedReport = (options: CliOptions): StageReport => {
  say(stepsPlan(options));

  return {
    onStage: (stage, index, count) => {
      say(`[${String(index)}/${String(count)}] ${STAGE_LABELS[stage]}`);
    },
    onWrite: (path) => {
      say(`  wrote ${path}`);
    },
    onNotice: (message) => {
      say(`  ${message}`);
    },
    // Six spaces, so it sits under the label rather than under the counter.
    onStageDone: (_stage, milliseconds) => {
      say(`      done in ${(milliseconds / 1000).toFixed(1)}s`);
    },
  };
};

/**
 * On a terminal a stage is one line: a spinner carrying the running count, replaced by what the stage did and what it
 * took. No plan above it, because the lines below are the plan.
 *
 * An `INHERITED_STAGES` member gets no spinner and prints its line once it has finished, under the output its binary
 * made: a repainting line and a scaffolder writing to the same terminal fight over it, and the scaffolder's own
 * progress is the one worth reading.
 */
const liveReport = (): StageReport => {
  const spin = spinner();
  let current: Stage = 'scaffold';
  let writes = 0;
  let notice = '';
  let spinning = false;

  return {
    onStage: (stage) => {
      current = stage;
      writes = 0;
      notice = '';
      spinning = !INHERITED_STAGES.has(stage);

      if (spinning) {
        spin.start(stageLine(stage, 0, ''));
      }
    },
    onWrite: () => {
      writes += 1;

      if (spinning) {
        spin.message(stageLine(current, writes, notice));
      }
    },
    onNotice: (message) => {
      notice = message;

      if (spinning) {
        spin.message(stageLine(current, writes, notice));
      }
    },
    onStageDone: (stage, milliseconds) => {
      const line = stageLine(stage, writes, notice, milliseconds);

      if (spinning) {
        spin.stop(line);
      }
      else {
        log.step(line);
      }
    },
  };
};

// Which shape a run prints in is the terminal's answer rather than an option: `stdout` is what these lines go to, and
// a redirected run has a terminal on stdin without one here.
export const stageReport = (options: CliOptions): StageReport => {
  return stdout.isTTY ? liveReport() : pipedReport(options);
};
