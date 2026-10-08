import { constants } from 'node:os';

import { OUTPUT_TAIL_LINES, SIGNAL_EXIT_BASE } from '../constants';

export interface Exit {
  code: number | string | null;
  signal: string | null;
  stdout: string;
  stderr: string;
}

// pnpm, or the shell under `pnpm run`, reports a kill as an exit code rather than a signal.
export const signalOf = ({ code, signal }: Pick<Exit, 'code' | 'signal'>): string | undefined => {
  if (signal !== null) {
    return signal;
  }

  if (typeof code !== 'number') {
    return undefined;
  }

  const named = Object.entries(constants.signals)
    .find(([, number]) => {
      return number === code - SIGNAL_EXIT_BASE;
    });

  return named?.[0];
};

const tailOf = (text: string): string => {
  const lines = text
    .trimEnd()
    .split('\n');
  const cut = lines.length - OUTPUT_TAIL_LINES;

  if (cut <= 0) {
    return lines.join('\n');
  }

  const tail = [`(${String(cut)} earlier lines cut)`, ...lines.slice(cut)];

  return tail.join('\n');
};

// Both streams, since a step may explain itself on either, and a kill named so it is not read as the step's own fault.
export const failureOf = (exit: Exit): string => {
  const signal = signalOf(exit);
  const headline = signal === undefined
    ? `failed (exit ${String(exit.code)})`
    : `killed by ${signal}, not a failure of its own: rerun it`;
  const streams = [exit.stdout, exit.stderr]
    .filter((text) => {
      return text.trim() !== '';
    })
    .map(tailOf);
  const output = streams.length === 0 ? ['(no output)'] : streams;

  const report = [headline, ...output];

  return report.join('\n');
};
