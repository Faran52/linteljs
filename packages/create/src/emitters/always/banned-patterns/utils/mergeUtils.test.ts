import {
  describe,
  expect,
  it,
} from 'vitest';

import { mergeChecker } from './mergeUtils';

const SHIPPED = [
  'const BASE_SKIPPED = [];',
  '',
  'const PROJECT_SKIPPED: string[] = [];',
  '',
  'const PROJECT_BANNED: Banned[] = [];',
  '',
  'export const run = () => {};',
].join('\n');

const withBlocks = (skipped: string, banned: string): string => {
  return [
    'const BASE_SKIPPED = [];',
    '',
    skipped,
    '',
    banned,
    '',
    'export const run = () => {};',
  ].join('\n');
};

describe('mergeChecker', () => {
  it('answers the shipped file whole when there is nothing on disk', () => {
    expect(mergeChecker(SHIPPED, null)).toBe(SHIPPED);
  });

  it('lifts both of the project blocks over the shipped ones', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      "const PROJECT_BANNED: Banned[] = [{ pattern: 'TODO' }];",
    );

    expect(mergeChecker(SHIPPED, current)).toBe(current);
  });

  // The pattern list is the shipped file's, always: a project that froze it would never see a new pattern.
  it('keeps the shipped declarations outside those two blocks', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    ).replace('export const run = () => {};', 'export const run = () => { old(); };');

    expect(mergeChecker(SHIPPED, current)).toContain('export const run = () => {};');
    expect(mergeChecker(SHIPPED, current)).not.toContain('old();');
  });

  // The defect the block reader was written for: a reason quoting `arr[0];` used to end the block early.
  it('reads a multi-line block to its own closing bracket, not to a semicolon inside a reason', () => {
    const skipped = [
      'const PROJECT_SKIPPED: string[] = [',
      '  // Indexing like arr[0]; is the reason, not the end of the list.',
      "  'src/legacy.ts',",
      '];',
    ].join('\n');
    const current = withBlocks(skipped, 'const PROJECT_BANNED: Banned[] = [];');

    // Whole, so the block is lifted to its bracket and not a line past it.
    expect(mergeChecker(SHIPPED, current)).toBe(current);
  });

  it('finds a block however near the top of the file it opens', () => {
    const current = "\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];\n";

    expect(mergeChecker(SHIPPED, current)).toContain("const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
  });

  // `String.replace` reads `$&` and `$'` in a string replacement as the match and the text after it.
  it('carries a project block verbatim when its text reads as a replacement pattern', () => {
    const skipped = "const PROJECT_SKIPPED: string[] = ['$& and $\' are literal'];";
    const current = withBlocks(skipped, 'const PROJECT_BANNED: Banned[] = [];');

    expect(mergeChecker(SHIPPED, current)).toContain(skipped);
  });

  it('leaves the shipped block alone when the project never declared one', () => {
    const current = 'const BASE_SKIPPED = [];\n\nexport const run = () => {};';

    expect(mergeChecker(SHIPPED, current)).toBe(SHIPPED);
  });

  // A `null` in the shipped text, as the real checker has, is not a block to replace.
  it('leaves the project block behind when the shipped file no longer declares it', () => {
    const shipped = 'const BASE_SKIPPED = [];\n\nexport const run = () => null;';
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    expect(mergeChecker(shipped, current)).toBe(shipped);
  });

  // An edit that broke the block leaves nothing to lift, so the shipped one stands rather than half a list.
  it('leaves the shipped block alone when the project left one unterminated', () => {
    const current = "const PROJECT_BANNED: Banned[] = [\n  { pattern: 'TODO' },\n";

    expect(mergeChecker(SHIPPED, current)).toBe(SHIPPED);
  });
});
