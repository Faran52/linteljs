import { stdout } from 'node:process';

import {
  MANAGER_BINARIES,
  RUN_PREFIX,
  STAGES,
} from '@config/constants';
import {
  type PackageManager,
  type RunOutput,
  type Stage,
} from '@config/types';

import {
  SPINNER_FRAMES,
  SPINNER_INTERVAL,
  STAGE_LABELS,
  STAGE_WIDTH,
} from '../constants';

import type { PipelineOptions } from '@pipeline';
import type { CliOptions } from './argvUtils';

export interface StageReport extends Required<Pick<PipelineOptions,
  'onNotice'
  | 'onStage'
  | 'onStageDone'
  | 'onWrite'
>> {
  output: RunOutput;
}

interface LiveLine {
  stage: Stage;
  writes: number;
  notice: string;
}

export const say = (message: string): void => {
  stdout.write(`${message}\n`);
};

// The scaffolder and the install write their own files and only speak.
export const stageLine = (stage: Stage, writes: number, notice: string, milliseconds?: number): string => {
  const files = writes === 1 ? 'file' : 'files';
  const wrote = writes > 0 ? `${String(writes)} ${files}` : notice;
  const took = milliseconds === undefined ? '' : `${(milliseconds / 1000).toFixed(1)}s`;

  const summary = [wrote, took]
    .filter((part) => {
      return part !== '';
    })
    .join(', ');

  return `${stage.padEnd(STAGE_WIDTH)}  ${summary}`.trimEnd();
};

export const nextSteps = (name: string, options: CliOptions, packageManager: PackageManager): string => {
  const run = RUN_PREFIX[packageManager];
  const enter = options.existing || name === '' ? [] : [`  cd ${name}`];
  const install = options.skip.includes('install')
    ? [`  ${MANAGER_BINARIES[packageManager]} install`, `  ${run} lint:fix`]
    : [];

  return [
    '',
    'Done. Next:',
    ...enter,
    ...install,
    `  ${run} check`,
  ].join('\n');
};

// A skipped stage is easier to read here than to notice missing below.
export const stepsPlan = (options: CliOptions): string => {
  const lines = STAGES
    .map((stage, index) => {
      // With lint skipped there is nothing of ours to fix against.
      const skipped = options.skip.includes(stage) || (stage === 'fix' && options.skip.includes('lint'));

      return `  ${String(index + 1)}. ${STAGE_LABELS[stage]}${skipped ? ' (skipped)' : ''}`;
    });

  return [
    '',
    'Steps:',
    ...lines,
  ].join('\n');
};

// Behind a pipe every event is its own line: what a CI log carries and the e2e suite reads.
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

// `clear, text, carriage return`, so a failure printed by `main` lands over the spinner's line.
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

// A redirected run has a terminal on stdin without one on stdout.
export const stageReport = (options: CliOptions): StageReport => {
  return stdout.isTTY ? liveReport() : pipedReport(options);
};
