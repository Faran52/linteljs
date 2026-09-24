import { stdout } from 'node:process';

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { STAGES } from '#config/constants';

import {
  SPINNER_FRAMES,
  SPINNER_INTERVAL,
  STAGE_LABELS,
} from '../constants';

import {
  say,
  stageLine,
  stageReport,
  stepsPlan,
} from './reportUtils';

import type { CliOptions } from './argvUtils';

const OPTIONS: CliOptions = {
  command: 'create',
  name: 'demo',
  cwd: '/projects/demo',
  skip: [],
  existing: false,
  unknownSkips: [],
  unexpectedArguments: [],
  yes: true,
  seed: false,
  force: false,
  help: false,
  version: false,
};

// `isTTY` is a plain property on the stream rather than an accessor, so it is replaced and put back.
const asTerminal = (value: boolean | undefined): void => {
  Object.defineProperty(stdout, 'isTTY', {
    value,
    configurable: true,
    writable: true,
  });
};

const inherited = stdout.isTTY;

const printed = (run: () => void): string => {
  const chunks: string[] = [];
  const writing = vi.spyOn(stdout, 'write').mockImplementation((chunk) => {
    chunks.push(String(chunk));

    return true;
  });

  try {
    run();

    return chunks.join('');
  }
  finally {
    writing.mockRestore();
  }
};

afterEach(() => {
  asTerminal(inherited);
});

describe('stageLine', () => {
  it('counts the files a stage wrote', () => {
    expect(stageLine('standard', 44, '', 123)).toBe('standard  44 files, 0.1s');
  });

  it('counts one file in the singular', () => {
    expect(stageLine('lint', 1, '', 40)).toBe('lint      1 file, 0.0s');
  });

  // The install writes nothing through the pipeline, so what it said is all it has.
  it('falls back to what a stage said where it wrote nothing', () => {
    expect(stageLine('install', 0, 'installing with pnpm', 12_100)).toBe('install   installing with pnpm, 12.1s');
  });

  // The spinner's own message, before the stage has finished and there is a time to give.
  it('omits the time while the stage is still running', () => {
    expect(stageLine('standard', 12, '')).toBe('standard  12 files');
  });

  it('carries the time alone where a stage neither wrote nor spoke', () => {
    expect(stageLine('fix', 0, '', 8400)).toBe('fix       8.4s');
  });

  // The first frame of a stage that has done nothing yet: the padding is for a summary, so with none it goes.
  it('is the stage name alone where there is nothing yet to say', () => {
    expect(stageLine('fix', 0, '')).toBe('fix');
  });
});

describe('stepsPlan', () => {
  it('numbers every stage in order', () => {
    expect(stepsPlan(OPTIONS)).toContain('  1. lint:');
    expect(stepsPlan(OPTIONS)).toContain('  4. install');
  });

  // The rule `pipelineRun` applies: with lint skipped there is nothing of ours left for fix to run over.
  it('marks a skipped stage, and the fix that skipping lint takes with it', () => {
    const plan = stepsPlan({
      ...OPTIONS,
      skip: ['lint'],
    });

    expect(plan).toContain('  1. lint: eslint and stylelint config (skipped)');
    expect(plan).toContain('  5. fix: eslint and stylelint --fix (skipped)');
    expect(plan).not.toContain('lint: (skipped)');
  });

  // The end-to-end suite reads this block, so its shape is held line by line: a header, then one line per stage.
  it('is a header and one numbered line per stage, none marked where nothing was skipped', () => {
    expect(stepsPlan(OPTIONS).split('\n')).toEqual([
      '',
      'Steps:',
      ...STAGES.map((stage, index) => {
        return `  ${String(index + 1)}. ${STAGE_LABELS[stage]}`;
      }),
    ]);
  });

  it('marks only the stages lint takes with it, not every stage after it', () => {
    const plan = stepsPlan({
      ...OPTIONS,
      skip: ['lint'],
    });

    expect(plan.split('\n').filter((line) => {
      return line.endsWith('(skipped)');
    })).toHaveLength(2);
  });
});

describe('say', () => {
  it('writes one line', () => {
    expect(printed(() => {
      say('a line');
    })).toBe('a line\n');
  });
});

describe('stageReport behind a pipe', () => {
  it('prints the plan as it is built, then a line per event', () => {
    asTerminal(undefined);

    const output = printed(() => {
      const report = stageReport(OPTIONS);

      report.onStage('package', 3, 6);
      report.onWrite('package.json');
      report.onNotice('removed tsconfig.app.json, which nothing references now');
      report.onStageDone('package', 60);
    });

    expect(output).toContain('Steps:');
    expect(output).toContain('[3/6] package: package.json, tsconfig and the manager files\n');
    expect(output).toContain('  wrote package.json\n');
    expect(output).toContain('  removed tsconfig.app.json, which nothing references now\n');
    expect(output).toContain('      done in 0.1s\n');
  });
});

describe('stageReport on a terminal', () => {
  it('replaces the spinner with what the stage did, and prints no plan', () => {
    asTerminal(true);

    const output = printed(() => {
      const report = stageReport(OPTIONS);

      report.onStage('standard', 4, 6);
      report.onNotice('git init: the husky hooks install on the next install');
      report.onWrite('CLAUDE.md');
      report.onWrite('AGENTS.md');
      report.onStageDone('standard', 100);
    });

    expect(output).not.toContain('Steps:');
    expect(output).not.toContain('wrote CLAUDE.md');
    // The first frame is painted as the stage starts, so something is on the line before anything is counted.
    expect(output).toContain('standard');
    expect(output).toContain('\u2713 standard  2 files, 0.1s');
  });

  // Nothing else writes to this terminal now, so the two stages that spawn a binary spin like the rest.
  it('spins for a stage that spawns a binary, and says what it said', () => {
    asTerminal(true);

    const output = printed(() => {
      const report = stageReport(OPTIONS);

      report.onStage('install', 5, 6);
      report.onNotice('installing with pnpm');
      report.onStageDone('install', 12_100);
    });

    expect(output).toContain('\u2713 install   installing with pnpm, 12.1s');
  });

  it('paints the first frame as the stage starts, and turns one frame per interval', () => {
    asTerminal(true);
    vi.useFakeTimers();

    try {
      const output = printed(() => {
        stageReport(OPTIONS).onStage('standard', 3, 5);
        vi.advanceTimersByTime(SPINNER_INTERVAL);
      });

      expect(SPINNER_FRAMES.charAt(2)).not.toBe(SPINNER_FRAMES.charAt(1));
      expect(output).toBe([
        `\u001B[K  ${SPINNER_FRAMES.charAt(1)} standard\r`,
        `\u001B[K  ${SPINNER_FRAMES.charAt(2)} standard\r`,
      ].join(''));
    }
    finally {
      vi.useRealTimers();
    }
  });

  // What the last stage said is its own: the next stage starts from nothing written and nothing said.
  it('starts each stage from a clean line rather than the last stage\'s count', () => {
    asTerminal(true);
    vi.useFakeTimers();

    try {
      const output = printed(() => {
        const report = stageReport(OPTIONS);

        report.onStage('lint', 1, 5);
        report.onWrite('eslint.config.js');
        report.onNotice('said by lint');
        report.onStageDone('lint', 10);
        report.onStage('package', 2, 5);
      });

      expect(output.endsWith(`\u001B[K  ${SPINNER_FRAMES.charAt(2)} package\r`)).toBe(true);
    }
    finally {
      vi.useRealTimers();
    }
  });

  it('stops turning once the stage is done', () => {
    asTerminal(true);
    vi.useFakeTimers();

    try {
      const report = stageReport(OPTIONS);

      const output = printed(() => {
        report.onStage('install', 4, 5);
        report.onStageDone('install', 10);
        vi.advanceTimersByTime(SPINNER_INTERVAL * 3);
      });

      expect(output.endsWith('✓ install   0.0s\n')).toBe(true);
    }
    finally {
      vi.useRealTimers();
    }
  });

  // The two halves of one decision: a spinner owns the line only because the binaries are handing their output back.
  it('captures a spawn on a terminal and lets it write behind a pipe', () => {
    asTerminal(true);

    expect(stageReport(OPTIONS).output).toBe('capture');

    asTerminal(undefined);

    expect(stageReport(OPTIONS).output).toBe('inherit');
  });
});
