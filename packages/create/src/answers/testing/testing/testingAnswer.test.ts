import { testingAnswer } from './testingAnswer';

describe('testingAnswer', () => {
  it('is keyed testing', () => {
    expect(testingAnswer.key).toBe('testing');
  });

  it('defaults to a value it offers', () => {
    expect(Object.keys(testingAnswer.values)).toContain(testingAnswer.default);
  });
});
