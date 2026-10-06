interface Position {
  line: number;
}

interface Location {
  start: Position;
}

interface Mutant {
  mutatorName: string;
  replacement?: string;
  status: string;
  location: Location;
}

interface FileResult {
  mutants: Mutant[];
}

interface MutationReport {
  files: Record<string, FileResult>;
}

export interface Unkilled {
  at: string;
  status: string;
  mutator: string;
  replacement: string;
}

const UNKILLED = new Set([
  'Timeout',
  'Survived',
  'NoCoverage',
]);

const isReport = (value: unknown): value is MutationReport => {
  return typeof value === 'object' && value !== null && 'files' in value;
};

// Every mutant a run did not kill, in file and line order, so each one is fixable from the run page.
export const unkilledIn = (report: unknown): Unkilled[] => {
  if (!isReport(report)) {
    throw new Error('not a Stryker mutation report: no `files`');
  }

  const found = Object.entries(report.files)
    .flatMap(([file, { mutants }]) => {
      return mutants
        .filter((mutant) => {
          return UNKILLED.has(mutant.status);
        })
        .map((mutant) => {
          const { line } = mutant.location.start;
          const entry = {
            file,
            line,
            unkilled: {
              at: `${file}:${String(line)}`,
              status: mutant.status,
              mutator: mutant.mutatorName,
              replacement: mutant.replacement ?? '',
            },
          };
          return entry;
        });
    });

  return found
    .toSorted((left, right) => {
      return left.file.localeCompare(right.file) || left.line - right.line;
    })
    .map(({ unkilled }) => {
      return unkilled;
    });
};

const cell = (text: string): string => {
  const escaped = text
    .replaceAll('\n', String.raw`\n`)
    .replaceAll('|', String.raw`\|`);
  return `\`${escaped}\``;
};

export const markdownFor = (title: string, unkilled: Unkilled[]): string => {
  if (unkilled.length === 0) {
    return `### ${title}\n\nEvery mutant killed.\n`;
  }

  const rows = unkilled
    .map(({
      at,
      status,
      mutator,
      replacement,
    }) => {
      return `| ${cell(at)} | ${status} | ${mutator} | ${cell(replacement)} |`;
    });

  const lines = [
    `### ${title}: ${String(unkilled.length)} not killed`,
    '',
    '| file:line | status | mutator | replacement |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ];
  return lines.join('\n');
};

export const logLinesFor = (unkilled: Unkilled[]): string[] => {
  return unkilled
    .map(({
      at,
      status,
      mutator,
      replacement,
    }) => {
      return `${status} ${at} ${mutator} -> ${JSON.stringify(replacement)}`;
    });
};

// The audit's bar is zero, which Stryker's `break` threshold cannot express, so this step is the gate.
export const exitCodeFor = (unkilled: Unkilled[]): number => {
  return unkilled.length === 0 ? 0 : 1;
};
