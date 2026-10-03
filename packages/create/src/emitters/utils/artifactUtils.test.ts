import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  copied,
  emitted,
  joined,
  merged,
} from './artifactUtils';

describe('emitted', () => {
  it('carries the given stage and target with the text as its content', () => {
    const actual = emitted('lint', 'eslint.config.js', 'export default {};');
    const expected = {
      stage: 'lint',
      target: 'eslint.config.js',
      content: { text: 'export default {};' },
    };
    expect(actual).toEqual(expected);
  });
});

describe('copied', () => {
  it('always tags the artifact stage standard, regardless of what the caller runs at', () => {
    const actual = copied('.claude/settings.json');
    const expected = {
      stage: 'standard',
      target: '.claude/settings.json',
      content: { sources: ['project/.claude/settings.json'] },
    };
    expect(actual).toEqual(expected);
  });

  it('reads a nested file from the same path under `project/` that it lands on', () => {
    const expected = {
      sources: ['project/scripts/typecheckStaged.ts'],
    };
    expect(copied('scripts/typecheckStaged.ts').content).toEqual(expected);
  });
});

describe('joined', () => {
  it('keeps the given sources in the order it was handed them', () => {
    const artifact = joined('src/setupTests.ts', [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.router.ts',
    ]);

    const expected = {
      stage: 'standard',
      target: 'src/setupTests.ts',
      content: {
        sources: [
          'fragments/test-setup/setupTests.ts',
          'fragments/test-setup/setupTests.router.ts',
        ],
      },
    };
    expect(artifact).toEqual(expected);
  });
});

describe('merged', () => {
  it('carries the given stage and target with the merge as its content', () => {
    const merge = (current: string | null): string => {
      return current ?? '';
    };

    const actual = merged('package', 'package.json', merge);
    const expected = {
      stage: 'package',
      target: 'package.json',
      content: { merge },
    };
    expect(actual).toStrictEqual(expected);
  });
});

describe('merged with a resync', () => {
  it('carries the resync beside the merge', () => {
    const merge = (current: string | null): string => {
      return current ?? '';
    };

    const resync = (current: string): string => {
      return current;
    };

    const expected = {
      merge,
      resync,
    };
    expect(merged('package', 'package.json', merge, resync).content).toEqual(expected);
  });
});
