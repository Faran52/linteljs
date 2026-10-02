import {
  describe,
  expect,
  it,
} from 'vitest';

import { loggerUtilsEmitter } from './loggerUtilsEmitter';

describe('loggerUtilsEmitter', () => {
  it('copies the shipped script from the path it lands on', () => {
    const loggerUtils = loggerUtilsEmitter();
    const expected = [{
      stage: 'standard',
      target: 'scripts/utils/loggerUtils.ts',
      content: { sources: ['project/scripts/utils/loggerUtils.ts'] },
    }];
    expect(loggerUtils).toEqual(expected);
  });
});
