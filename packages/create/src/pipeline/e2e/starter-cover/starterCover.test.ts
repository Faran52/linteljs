import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { starterSourceEmitter } from '@emitters';

import { STARTER_CASES } from './constants';
import {
  starterCases,
  starterCover,
  writtenOf,
} from './starterCover';

import type { Answers } from '@config/types';

const NOT_A_CASE = 'react pnpm vitest no-such-answer';

describe('starterCover', () => {
  it('reaches every starter text from the committed cases', () => {
    const cover = starterCover(STARTER_CASES);
    const toAdd = `add to STARTER_CASES:\n${cover.suggested.join('\n')}`;

    expect(cover.uncovered, toAdd).toBe(0);
    expect(cover.unknown).toStrictEqual([]);
    expect(cover.unplaced).toStrictEqual([]);
    expect(cover.suggested).toStrictEqual([]);
  });

  it('suggests cases that reach what no case reaches', () => {
    const cover = starterCover([]);
    const again = starterCover(cover.suggested);

    expect(cover.texts).toBeGreaterThan(0);
    expect(cover.uncovered).toBe(cover.texts);
    expect(again.uncovered).toBe(0);
  });

  it('names a label no case carries', () => {
    const labels = [NOT_A_CASE];
    const cover = starterCover(labels);

    expect(cover.unknown).toStrictEqual(labels);
  });
});

describe('starterCases', () => {
  it('answers each committed label with its case, dropping one it does not know', () => {
    const labels = [...STARTER_CASES, NOT_A_CASE];
    const cases = starterCases(labels);
    const caseLabels = cases
      .map(({ label }) => {
        return label;
      });

    expect(caseLabels).toStrictEqual(STARTER_CASES);
  });
});

describe('writtenOf', () => {
  it('drops a starter test whose covered file is not written', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'react',
      testing: 'vitest',
      router: 'react-router-framework',
    };
    const artifacts = starterSourceEmitter(answers);
    const targets = writtenOf(artifacts)
      .map(({ target }) => {
        return target;
      });

    expect(targets).not.toContain('src/components/features/error-boundary/ErrorBoundary.test.tsx');
    expect(targets).toContain('src/components/features/route-error/RouteError.test.tsx');
  });
});
