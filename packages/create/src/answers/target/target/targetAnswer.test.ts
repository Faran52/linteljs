import { targetAnswer } from './targetAnswer';

describe('targetAnswer', () => {
  it('is keyed target', () => {
    expect(targetAnswer.key).toBe('target');
  });

  it('defaults to a value it offers', () => {
    expect(Object.keys(targetAnswer.values)).toContain(targetAnswer.default);
  });
});
