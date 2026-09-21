import { typeSafetyAnswer } from './typeSafetyAnswer';

describe('typeSafetyAnswer', () => {
  it('is keyed typeSafety', () => {
    expect(typeSafetyAnswer.key).toBe('typeSafety');
  });

  it('defaults to a value it offers', () => {
    expect(Object.keys(typeSafetyAnswer.values)).toContain(typeSafetyAnswer.default);
  });
});
