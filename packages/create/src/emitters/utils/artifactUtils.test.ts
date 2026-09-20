import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  copied,
  emitted,
  joined,
} from './artifactUtils';

describe('emitted', () => {
  it('carries the given stage and target with the text as its content', () => {
    expect(emitted('lint', 'eslint.config.js', 'export default {};')).toEqual({
      stage: 'lint',
      target: 'eslint.config.js',
      content: { text: 'export default {};' },
    });
  });
});

describe('copied', () => {
  it('always tags the artifact stage standard, regardless of what the caller runs at', () => {
    expect(copied('.claude/settings.json')).toEqual({
      stage: 'standard',
      target: '.claude/settings.json',
      content: { sources: ['project/.claude/settings.json'] },
    });
  });

  it('reads a nested file from the same path under `project/` that it lands on', () => {
    expect(copied('scripts/typecheckStaged.ts').content).toEqual({
      sources: ['project/scripts/typecheckStaged.ts'],
    });
  });
});

describe('joined', () => {
  it('keeps the given sources in the order it was handed them', () => {
    expect(joined('src/setupTests.ts', [
      'fragments/test-setup/setupTests.ts',
      'fragments/test-setup/setupTests.router.ts',
    ])).toEqual({
      stage: 'standard',
      target: 'src/setupTests.ts',
      content: {
        sources: [
          'fragments/test-setup/setupTests.ts',
          'fragments/test-setup/setupTests.router.ts',
        ],
      },
    });
  });
});
