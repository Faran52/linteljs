import {
  describe,
  expect,
  it,
} from 'vitest';

import { copied, emitted } from './artifact';

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
    expect(copied('.claude/settings.json', 'claude/settings.json')).toEqual({
      stage: 'standard',
      target: '.claude/settings.json',
      content: { sources: ['claude/settings.json'] },
    });
  });

  it('names a single source, ready for a second to be spread in by the caller', () => {
    expect(copied('README.md', 'readme/template.md').content).toEqual({
      sources: ['readme/template.md'],
    });
  });
});
