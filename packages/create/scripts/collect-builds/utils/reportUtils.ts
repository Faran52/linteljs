import { difference, uniq } from 'es-toolkit';

import { COLUMN_WIDTH } from '../constants.ts';

import type { Collected } from './passesUtils.ts';

export type Found = [string, Record<Collected, string[]>][];

const sorted = (names: string[]): string => {
  const list = uniq(names)
    .toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    });

  return list.length === 0
    ? '  (none)'
    : list
        .map((name) => {
          return `  '${name}'`;
        })
        .join('\n');
};

export const reportLines = (found: Found): string[] => {
  const rows = found
    .map(([label, { pnpm, npm }]) => {
      const extra = difference(npm, pnpm);

      const row = {
        label,
        pnpm,
        extra,
      };

      return row;
    });

  const table = [
    `  ${'target'.padEnd(COLUMN_WIDTH.target)}${'pnpm'.padEnd(COLUMN_WIDTH.pnpm)}npm only`,
    ...rows
      .map(({
        label,
        pnpm,
        extra,
      }) => {
        return `  ${label.padEnd(COLUMN_WIDTH.target)}${(pnpm.join(', ') || '(none)').padEnd(COLUMN_WIDTH.pnpm)}`
          + (extra.join(', ') || '-');
      }),
  ].join('\n');

  const union = sorted(found
    .flatMap(([, { pnpm, npm }]) => {
      return pnpm.concat(npm);
    }));

  const npmOnly = sorted(rows
    .flatMap(({ extra }) => {
      return extra;
    }));

  const lines = [
    table,
    `Union, for allowBuilds:\n${union}`,
    `Blocked by npm and not by pnpm, which is what NPM_ALLOWED_BUILDS holds:\n${npmOnly}`,
  ];

  return lines;
};
