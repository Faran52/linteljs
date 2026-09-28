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

  it('keeps the shipped declarations outside those two blocks', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    ).replace('export const run = () => {};', 'export const run = () => { old(); };');

    expect(mergeChecker(SHIPPED, current)).toContain('export const run = () => {};');
    expect(mergeChecker(SHIPPED, current)).not.toContain('old();');
  });

  it('takes the block that opens a line, not one a comment names first', () => {
    const current = withBlocks(
      "// const PROJECT_SKIPPED: string[] = ['src/old.ts'];\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    expect(mergeChecker(SHIPPED, current)).toContain("\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
    expect(mergeChecker(SHIPPED, current)).not.toContain("const PROJECT_SKIPPED: string[] = ['src/old.ts'];");
  });

  it('takes the block of that exact name, not a longer one declared ahead of it', () => {
    const current = withBlocks(
      "const PROJECT_SKIPPED_LEGACY: string[] = ['src/old.ts'];\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    expect(mergeChecker(SHIPPED, current)).toContain("\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
    expect(mergeChecker(SHIPPED, current)).not.toContain('PROJECT_SKIPPED_LEGACY');
  });

  it('reads a multi-line block to its own closing bracket, not to a semicolon inside a reason', () => {
    const skipped = [
      'const PROJECT_SKIPPED: string[] = [',
      '  // Indexing like arr[0]; is the reason, not the end of the list.',
      "  'src/legacy.ts',",
      '];',
    ].join('\n');
    const current = withBlocks(skipped, 'const PROJECT_BANNED: Banned[] = [];');

    expect(mergeChecker(SHIPPED, current)).toBe(current);
  });

  it('finds a block however near the top of the file it opens', () => {
    const current = "\nconst PROJECT_SKIPPED: string[] = ['src/legacy.ts'];\n";

    expect(mergeChecker(SHIPPED, current)).toContain("const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];");
  });

  it('carries a project block verbatim when its text reads as a replacement pattern', () => {
    const skipped = "const PROJECT_SKIPPED: string[] = ['$& and $\' are literal'];";
    const current = withBlocks(skipped, 'const PROJECT_BANNED: Banned[] = [];');

    expect(mergeChecker(SHIPPED, current)).toContain(skipped);
  });

  it('leaves the shipped block alone when the project never declared one', () => {
    const current = 'const BASE_SKIPPED = [];\n\nexport const run = () => {};';

    expect(mergeChecker(SHIPPED, current)).toBe(SHIPPED);
  });

  it('leaves the project block behind when the shipped file no longer declares it', () => {
    const shipped = 'const BASE_SKIPPED = [];\n\nexport const run = () => null;';
    const current = withBlocks(
      "const PROJECT_SKIPPED: string[] = ['src/legacy.ts'];",
      'const PROJECT_BANNED: Banned[] = [];',
    );

    expect(mergeChecker(shipped, current)).toBe(shipped);
  });

  it('leaves the shipped block alone when the project left one unterminated', () => {
    const current = "const PROJECT_BANNED: Banned[] = [\n  { pattern: 'TODO' },\n";

    expect(mergeChecker(SHIPPED, current)).toBe(SHIPPED);
  });
});
