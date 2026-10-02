import { targetAnswer } from './targetAnswer';

describe('targetAnswer', () => {
  it('is keyed target', () => {
    expect(targetAnswer.key).toBe('target');
  });

  it('defaults to a value it offers', () => {
    const actual = Object.keys(targetAnswer.values);
    expect(actual).toContain(targetAnswer.default);
  });
});
