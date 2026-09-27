import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

import { run } from '../../utils/processUtils.ts';
import {
  REPORT_FILE,
  THRESHOLD_METRICS,
  THRESHOLD_OFF,
} from '../constants.ts';

import { type CoverageReport, isCoverageReport } from './coverageUtils.ts';

// A run that wrote a report, one that wrote none, or one killed at the deadline.
export type RunOutcome = CoverageReport | 'failed' | 'timed out';

interface ListedTest {
  file: string;
}

const isListedTests = (value: unknown): value is ListedTest[] => {
  return Array.isArray(value) && value.every((entry: unknown) => {
    return typeof entry === 'object' && entry !== null && 'file' in entry && typeof entry.file === 'string';
  });
};

// Every test file the workspace's projects collect, as absolute paths: vitest's own include and exclude decide.
export const listTests = (cwd: string): string[] => {
  const listed: unknown = JSON.parse(run('pnpm', ['exec', 'vitest', 'list', '--filesOnly', '--json'], cwd));

  if (!isListedTests(listed)) {
    throw new Error('vitest list answered something other than a list of files');
  }

  return listed.map(({ file }) => {
    return file;
  });
};

/**
 * One test file alone, from the root so `coverage.include` and `exclude` apply as configured. The path is a filter
 * vitest matches by substring, and a root-relative path is unique. Every threshold key is zeroed, since one file
 * alone is never meant to meet the merged gate. The report decides, not the exit code, so the run's own output and
 * status are dropped.
 */
export const coverageRun = async (
  cwd: string,
  test: string,
  reportsDirectory: string,
  thresholdKeys: string[],
  timeoutMs: number,
): Promise<RunOutcome> => {
  // The bin itself rather than `pnpm exec`, which starts vitest in a process group the deadline cannot reach.
  const child = spawn(join(cwd, 'node_modules', '.bin', 'vitest'), [
    'run',
    test,
    '--coverage.enabled',
    '--coverage.reporter=json',
    `--coverage.reportsDirectory=${reportsDirectory}`,
    ...thresholdKeys.flatMap((key) => {
      return THRESHOLD_METRICS.map((metric) => {
        return `--coverage.thresholds.${key}.${metric}=${String(THRESHOLD_OFF)}`;
      });
    }),
  ], {
    cwd,
    stdio: 'ignore',
    // Its own process group, so the deadline kills vitest's workers with it rather than orphaning them.
    detached: true,
  });
  const deadline = AbortSignal.timeout(timeoutMs);
  const kill = (): void => {
    if (child.pid !== undefined) {
      process.kill(-child.pid, 'SIGKILL');
    }
  };

  deadline.addEventListener('abort', kill, { once: true });
  await once(child, 'close');
  deadline.removeEventListener('abort', kill);

  if (deadline.aborted) {
    return 'timed out';
  }

  try {
    const report: unknown = JSON.parse(await readFile(join(reportsDirectory, REPORT_FILE), 'utf8'));

    return isCoverageReport(report) ? report : 'failed';
  }
  catch {
    return 'failed';
  }
};
