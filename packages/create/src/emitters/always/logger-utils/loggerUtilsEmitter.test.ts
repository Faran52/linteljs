import {
  describe,
  expect,
  it,
} from 'vitest';

import { loggerUtilsEmitter } from './loggerUtilsEmitter';

describe('loggerUtilsEmitter', () => {
  it('copies the shipped script from the path it lands on', () => {
    expect(loggerUtilsEmitter()).toEqual([{
      stage: 'standard',
      target: 'scripts/utils/loggerUtils.ts',
      content: { sources: ['project/scripts/utils/loggerUtils.ts'] },
    }]);
  });
});
