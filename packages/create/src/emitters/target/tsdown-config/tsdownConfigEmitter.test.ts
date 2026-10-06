import { hostedAnswersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { TSDOWN_CONFIG } from './constants';
import { tsdownConfigEmitter } from './tsdownConfigEmitter';

describe('tsdownConfigEmitter', () => {
  it('writes the bundler config for a library', () => {
    const artifacts = tsdownConfigEmitter(hostedAnswersFor({ target: 'typescript' }), EMPTY_PROJECT, 'my-lib');
    const expected = [{
      stage: 'standard',
      target: 'tsdown.config.ts',
      content: { text: TSDOWN_CONFIG },
    }];

    expect(artifacts).toEqual(expected);
  });

  it('writes nothing for an app', () => {
    const artifacts = tsdownConfigEmitter(hostedAnswersFor({ target: 'react' }), EMPTY_PROJECT, 'my-app');

    expect(artifacts).toEqual([]);
  });
});
