import { testingAnswer } from './testingAnswer';

describe('testingAnswer', () => {
  it('is keyed testing', () => {
    expect(testingAnswer.key).toBe('testing');
  });

  it('defaults to a value it offers', () => {
    const actual = Object.keys(testingAnswer.values);
    expect(actual).toContain(testingAnswer.default);
  });
});
