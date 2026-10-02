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
  const lines = [
    'const BASE_SKIPPED = [];',
    '',
    skipped,
    '',
    banned,
    '',
    'export const run = () => {};',
  ];
  return lines.join('\n');
};

describe('mergeChecker', () => {
  it('answers the shipped file whole when there is nothing on disk', () => {
    const mergedChecker = mergeChecker(SHIPPED, null);
    expect(mergedChecker).toBe(SHIPPED);
  });

  it('lifts both of the project blocks over the shipped ones', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      "const PROJECT_BANNED: Banned[] = [{ pattern: 'TODO' }];",
    );

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toBe(current);
  });

  it('keeps the shipped declarations outside those two blocks', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    ).replace('export const run = () => {};', 'export const run = () => { old(); };');

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toContain('export const run = () => {};');
    const shippedMergedChecker = mergeChecker(SHIPPED, current);
    expect(shippedMergedChecker).not.toContain('old();');
  });

  it('takes the block that opens a line, not one a comment names first', () => {
    const current = withBlocks(
      "// const PROJECT_SKIPPED: string[] = ['src/old.ts'];\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toContain("\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
    const shippedMergedChecker = mergeChecker(SHIPPED, current);
    expect(shippedMergedChecker).not.toContain("const PROJECT_SKIPPED: string[] = ['src/old.ts'];");
  });

  it('takes the block of that exact name, not a longer one declared ahead of it', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED_LEGACY: string[] = ['src/old.ts'];\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toContain("\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
    const shippedMergedChecker = mergeChecker(SHIPPED, current);
    expect(shippedMergedChecker).not.toContain('PROJECT_SKIPPED_LEGACY');
  });

  it('reads a multi-line block to its own closing bracket, not to a semicolon inside a reason', () => {
    const skipped = [
      'const PROJECT_SKIPPED: string[] = [',
      '  // Indexing like arr[0]; is the reason, not the end of the list.',
      "  'src/legacy.ts',",
      '];',
    ].join('\n');
    const current = withBlocks(skipped, 'const PROJECT_BANNED: Banned[] = [];');

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toBe(current);
  });

  it('finds a block however near the top of the file it opens', () => {
    const current = "\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];\n";

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toContain("const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
  });

  it('carries a project block verbatim when its text reads as a replacement pattern', () => {
    const skipped = "const PROJECT_SKIPPED: string[] = ['$& and $\' are literal'];";
    const current = withBlocks(skipped, 'const PROJECT_BANNED: Banned[] = [];');

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toContain(skipped);
  });

  it('leaves the shipped block alone when the project never declared one', () => {
    const current = 'const BASE_SKIPPED = [];\n\nexport const run = () => {};';

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toBe(SHIPPED);
  });

  it('leaves the project block behind when the shipped file no longer declares it', () => {
    const shipped = 'const BASE_SKIPPED = [];\n\nexport const run = () => null;';
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    const mergedChecker = mergeChecker(shipped, current);
    expect(mergedChecker).toBe(shipped);
  });

  it('leaves the shipped block alone when the project left one unterminated', () => {
    const current = "const PROJECT_BANNED: Banned[] = [\n  { pattern: 'TODO' },\n";

    const mergedChecker = mergeChecker(SHIPPED, current);
    expect(mergedChecker).toBe(SHIPPED);
  });
});
