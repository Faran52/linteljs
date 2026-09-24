import { readAnswer } from '../../utils/readUtils';

import { mockingAnswer } from './mockingAnswer';

describe('mockingAnswer', () => {
  it('reads msw as the one mocking layer', () => {
    expect(readAnswer(mockingAnswer, 'msw')).toBe('msw');
  });

  // Optional, so a config written before the answer existed still reads, as an api layer that answers locally.
  it('reads an absent answer as no mocking layer rather than refusing it', () => {
    expect(readAnswer(mockingAnswer, undefined)).toBeUndefined();
  });

  it('refuses a layer it does not offer, naming the field and what it takes', () => {
    expect(() => {
      return readAnswer(mockingAnswer, 'nock');
    }).toThrow('mocking must be one of: msw');
  });
});
