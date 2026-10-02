import { typeSafetyAnswer } from './typeSafetyAnswer';

describe('typeSafetyAnswer', () => {
  it('is keyed typeSafety', () => {
    expect(typeSafetyAnswer.key).toBe('typeSafety');
  });

  it('defaults to a value it offers', () => {
    const actual = Object.keys(typeSafetyAnswer.values);
    expect(actual).toContain(typeSafetyAnswer.default);
  });
});
