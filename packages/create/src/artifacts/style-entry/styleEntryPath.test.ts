import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Answers,
  DEFAULT_ANSWERS,
  TARGET_IDS,
  type TargetId,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

import { STYLE_ENTRY_CANDIDATES, styleEntryPath } from './styleEntryPath';

const answersFor = (target: TargetId): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    target,
  };
};

describe('styleEntryPath', () => {
  it("takes the project's own entry over the target's default", () => {
    expect(styleEntryPath(answersFor('webextension'), ['src/styles/tailwind.css']))
      .toBe('src/styles/tailwind.css');
  });

  it('falls back to the target default when the project has none', () => {
    expect(styleEntryPath(answersFor('webextension'), [])).toBe('src/style.css');
    expect(styleEntryPath(answersFor('next'), [])).toBe('src/app/globals.css');
  });

  // A default missing from the candidates is an entry that can never be found, so a second is written beside it.
  it('can discover every default a target declares', () => {
    const declared = TARGET_IDS
      .map((target) => {
        return targetFor(answersFor(target)).styleEntry;
      })
      .filter((entry) => {
        return entry !== undefined;
      });

    expect(declared.length).toBeGreaterThan(0);
    expect(STYLE_ENTRY_CANDIDATES).toEqual(expect.arrayContaining(declared));
  });
});

// A project keeping a `styles/global.css` beside the standard's entry was read as the second of the two.
describe('a project holding more than one candidate', () => {
  it("takes the target's own entry over another the project also has", () => {
    expect(styleEntryPath(
      answersFor('webextension'),
      ['src/styles/global.css', 'src/style.css'],
    )).toBe('src/style.css');
  });

  it('takes the discovered one when the target default is absent', () => {
    expect(styleEntryPath(
      answersFor('webextension'),
      ['src/styles/global.css'],
    )).toBe('src/styles/global.css');
  });
});
