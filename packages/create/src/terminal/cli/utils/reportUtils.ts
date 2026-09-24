import { stdout } from 'node:process';

import {
  MANAGER_BINARIES,
  RUN_PREFIX,
  STAGES,
} from '#config/constants';
import { type RunOutput, type Stage } from '#config/types';

import {
  SPINNER_FRAMES,
  SPINNER_INTERVAL,
  STAGE_LABELS,
  STAGE_WIDTH,
} from '../constants';

import type { PackageManager } from '#answers';
import type { PipelineOptions } from '#pipeline';
import type { CliOptions } from './argvUtils';

export interface StageReport extends Required<Pick<PipelineOptions,
  'onNotice'
  | 'onStage'
  | 'onStageDone'
  | 'onWrite'
>> {
  // Whether the scaffolder and the install write to this terminal, which is the same question the shape answers.
  output: RunOutput;
}

// What the spinner's line says about the stage running now.
interface LiveLine {
  stage: Stage;
  writes: number;
  notice: string;
}

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

// What to do next, once every stage has run: enter the directory, install what was skipped, run the gate.
export const nextSteps = (name: string, options: CliOptions, packageManager: PackageManager): string => {
  const run = RUN_PREFIX[packageManager];
  const enter = options.existing || name === '' ? [] : [`  cd ${name}`];
  const install = options.skip.includes('install')
    ? [`  ${MANAGER_BINARIES[packageManager]} install`, `  ${run} lint:fix`]
    : [];

  return ['', 'Done. Next:', ...enter, ...install, `  ${run} check`].join('\n');
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
// the end-to-end suite reads. The scaffolder and the install keep writing to the same pipe, so nothing is lost.
const pipedReport = (options: CliOptions): StageReport => {
  say(stepsPlan(options));

  return {
    output: 'inherit',
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
 * On a terminal a stage is one line, spinning while it works and left behind saying what it did. Nothing else writes
 * here: `output: 'capture'` keeps the scaffolder's and the installer's own progress off the line the spinner owns,
 * and a failure carries what they printed instead.
 *
 * Every frame is written as `clear, text, carriage return`, so the cursor rests at column zero: a failure printed by
 * `main` lands over the spinner's line rather than after it.
 */
const liveReport = (): StageReport => {
  // Assigned by `onStage`, which the pipeline calls before any other event of a stage.
  let line: LiveLine;
  let turning: ReturnType<typeof setInterval>;
  let frame = 0;

  const paint = (): void => {
    frame = (frame + 1) % SPINNER_FRAMES.length;
    stdout.write(`\u001B[K  ${SPINNER_FRAMES.charAt(frame)} ${stageLine(line.stage, line.writes, line.notice)}\r`);
  };

  return {
    output: 'capture',
    onStage: (stage) => {
      line = {
        stage,
        writes: 0,
        notice: '',
      };
      // Unreferenced, so a stage that throws cannot leave a timer holding the process open.
      turning = setInterval(paint, SPINNER_INTERVAL).unref();
      paint();
    },
    onWrite: () => {
      line.writes += 1;
    },
    onNotice: (message) => {
      line.notice = message;
    },
    onStageDone: (stage, milliseconds) => {
      clearInterval(turning);
      stdout.write(`\u001B[K  ✓ ${stageLine(stage, line.writes, line.notice, milliseconds)}\n`);
    },
  };
};

// Which shape a run prints in is the terminal's answer rather than an option: `stdout` is what these lines go to, and
// a redirected run has a terminal on stdin without one here.
export const stageReport = (options: CliOptions): StageReport => {
  return stdout.isTTY ? liveReport() : pipedReport(options);
};
