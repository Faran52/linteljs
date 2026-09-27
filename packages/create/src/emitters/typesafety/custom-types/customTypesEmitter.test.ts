import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { customTypesEmitter } from './customTypesEmitter';

describe('customTypesEmitter', () => {
  // The strict floor refuses what this file declares, so the answer it belongs to is the only one that gets it.
  it('writes nothing under the strict floor', () => {
    const artifacts = customTypesEmitter({
      ...DEFAULT_ANSWERS,
      typeSafety: 'strict',
    });

    expect(artifacts).toEqual([]);
  });

  it('copies the declarations the relaxed floor needs', () => {
    const artifacts = customTypesEmitter({
      ...DEFAULT_ANSWERS,
      typeSafety: 'relaxed',
    });

    expect(artifacts).toEqual([{
      stage: 'standard',
      target: 'src/typings/customTypes.d.ts',
      content: { sources: ['project/src/typings/customTypes.d.ts'] },
    }]);
  });
});
