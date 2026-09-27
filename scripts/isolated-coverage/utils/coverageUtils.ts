// The slice of istanbul's `coverage-final.json` this script reads. Maps are a fact of the source, so every run over
// the same file carries the same ids; only the counters differ.
interface Position {
  line: number;
}

interface Span {
  start: Position;
}

interface FunctionEntry {
  decl: Span;
}

interface BranchEntry {
  line: number;
  locations: Span[];
}

export interface FileCoverage {
  statementMap: Record<string, Span>;
  fnMap: Record<string, FunctionEntry>;
  branchMap: Record<string, BranchEntry>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

export type CoverageReport = Record<string, FileCoverage>;

export interface Attribution {
  coveredBy: string[];
  uncovered: string[];
}

export const isCoverageReport = (value: unknown): value is CoverageReport => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Every counter in a file as one key, `s:3`, `f:1` or `b:2:0` for arm 0 of branch 2.
export const entriesOf = (file: FileCoverage): string[] => {
  return [
    ...Object.keys(file.statementMap)
      .map((id) => {
        return `s:${id}`;
      }),
    ...Object.keys(file.fnMap)
      .map((id) => {
        return `f:${id}`;
      }),
    ...Object.entries(file.branchMap)
      .flatMap(([id, branch]) => {
        return branch.locations
          .map((_, arm) => {
            return `b:${id}:${String(arm)}`;
          });
      }),
  ];
};

// A table: statements and nothing else, so there is no behaviour for a suite of its own to hold.
export const isData = (file: FileCoverage): boolean => {
  return Object.keys(file.fnMap).length === 0 && Object.keys(file.branchMap).length === 0;
};

export const hitsOf = (file: FileCoverage): Set<string> => {
  const counts = [
    ...Object.entries(file.s)
      .map(([id, count]) => {
        return [`s:${id}`, count] as const;
      }),
    ...Object.entries(file.f)
      .map(([id, count]) => {
        return [`f:${id}`, count] as const;
      }),
    ...Object.entries(file.b)
      .flatMap(([id, arms]) => {
        return arms
          .map((count, arm) => {
            return [`b:${id}:${String(arm)}`, count] as const;
          });
      }),
  ];

  const hitKeys = counts
    .filter(([, count]) => {
      return count > 0;
    })
    .map(([key]) => {
      return key;
    });

  return new Set(hitKeys);
};

const percent = (hit: number, total: number): string => {
  return `${String(total === 0 ? 100 : Math.floor(hit * 100 / total))}%`;
};

// Istanbul's own line metric: a line is covered when a statement starting on it ran.
const linesOf = (file: FileCoverage, keys: Iterable<string>): Set<number> => {
  const lines = [...keys]
    .filter((key) => {
      return key.startsWith('s:');
    })
    .map((key) => {
      return file.statementMap[key.slice(2)]?.start.line ?? 0;
    });

  return new Set(lines);
};

export const metricsOf = (file: FileCoverage, hits: Set<string>): string => {
  const all = entriesOf(file);
  const ratio = (kind: string): string => {
    const ofKind = all
      .filter((key) => {
        return key.startsWith(kind);
      });

    const hitCount = ofKind.filter((key) => {
      return hits.has(key);
    }).length;

    return percent(hitCount, ofKind.length);
  };

  return [
    `${ratio('s:')} stmts`,
    `${ratio('b:')} branches`,
    `${ratio('f:')} funcs`,
    `${percent(linesOf(file, hits).size, linesOf(file, all).size)} lines`,
  ].join(' ');
};

export const gapOf = (file: FileCoverage, hits: Set<string>): string[] => {
  return entriesOf(file)
    .filter((key) => {
      return !hits.has(key);
    });
};

// `[40, 41, 42, 61]` reads as `L40-42, L61`.
const rangesOf = (lines: number[]): string[] => {
  const sorted = [...new Set(lines)]
    .toSorted((left, right) => {
      return left - right;
    });
  const ranges: [number, number][] = [];

  for (const line of sorted) {
    const last = ranges.at(-1);

    if (last !== undefined && line === last[1] + 1) {
      last[1] = line;
    }
    else {
      ranges.push([line, line]);
    }
  }

  return ranges
    .map(([first, end]) => {
      return first === end ? `L${String(first)}` : `L${String(first)}-${String(end)}`;
    });
};

export const describeGap = (file: FileCoverage, keys: string[]): string => {
  const lines = [...linesOf(file, keys)];
  const branches = keys
    .filter((key) => {
      return key.startsWith('b:');
    })
    .map((key) => {
      const [, id = '', arm = ''] = key.split(':');
      const branch = file.branchMap[id];

      return branch?.locations[Number(arm)]?.start.line ?? branch?.line ?? 0;
    });
  const functions = keys
    .filter((key) => {
      return key.startsWith('f:');
    })
    .map((key) => {
      return file.fnMap[key.slice(2)]?.decl.start.line ?? 0;
    });

  return [
    ...rangesOf(lines),
    ...rangesOf(branches)
      .map((range) => {
        return `branch ${range}`;
      }),
    ...rangesOf(functions)
      .map((range) => {
        return `fn ${range}`;
      }),
  ].join(', ');
};

// Which other runs hit any entry of the gap, and which entries no run hits at all.
export const attribute = (gap: string[], others: Map<string, Set<string>>): Attribution => {
  const coveredBy = [...others]
    .filter(([, hits]) => {
      return gap
        .some((key) => {
          return hits.has(key);
        });
    })
    .map(([test]) => {
      return test;
    })
    .toSorted((left, right) => {
      return left.localeCompare(right);
    });
  const uncovered = gap
    .filter((key) => {
      return ![...others.values()]
        .some((hits) => {
          return hits.has(key);
        });
    });

  return {
    coveredBy,
    uncovered,
  };
};
