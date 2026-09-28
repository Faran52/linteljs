import { captureFixer } from '@mocks/captureFixer';
import { sourceCodeFrom } from '@mocks/sourceCodeFrom';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { mustFind } from '../../../utils/ruleUtils.ts';

import { fixCommaToNewline } from './commaUtils.ts';

describe('fixCommaToNewline', () => {
  it('moves the element onto a line of its own at the given indent', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const alpha = [one, two];\n');
    const second = mustFind(
      sourceCode.getLastToken(firstNode('ArrayExpression'), 1),
    );

    expect(fixCommaToNewline(sourceCode, captureFixer(), second, '  ')?.text).toBe('\n  ');
  });

  it('offers no fix when a comment sits between the comma and the element', () => {
    const { sourceCode, firstNode } = sourceCodeFrom('const alpha = [one, /* kept */ two];\n');
    const second = mustFind(
      sourceCode.getLastToken(firstNode('ArrayExpression'), 1),
    );

    expect(fixCommaToNewline(sourceCode, captureFixer(), second, '  ')).toBeNull();
  });
});
