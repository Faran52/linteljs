import {
  describe,
  expect,
  it,
} from 'vitest';

import { STARTER_CASES } from './constants';
import { starterCases, starterCover } from './starterCover';

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
