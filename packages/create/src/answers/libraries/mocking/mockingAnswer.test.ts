import { targetFor } from '@targets';

import { DEFAULT_ANSWERS } from '../../registry';
import { readAnswer } from '../../utils/readUtils';

import { mockingAnswer } from './mockingAnswer';

describe('mockingAnswer', () => {
  it('takes a slot on an app and not on a library', () => {
    const app = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });
    const library = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });

    const onApp = mockingAnswer.slot(app);
    expect(onApp).toBe(true);
    const onLibrary = mockingAnswer.slot(library);
    expect(onLibrary).toBe(false);
  });

  it('reads msw as the one mocking layer', () => {
    const answer = readAnswer(mockingAnswer, 'msw');
    expect(answer).toBe('msw');
  });

  it('reads an absent answer as no mocking layer rather than refusing it', () => {
    const answer = readAnswer(mockingAnswer, undefined);
    expect(answer).toBeUndefined();
  });

  it('refuses a layer it does not offer, naming the field and what it takes', () => {
    expect(() => {
      return readAnswer(mockingAnswer, 'nock');
    }).toThrow('mocking must be one of: msw');
  });
});
