import { layoutAnswer } from './layoutAnswer';

describe('layoutAnswer', () => {
  it('is keyed layout', () => {
    expect(layoutAnswer.key).toBe('layout');
  });

  it('defaults to a single repo', () => {
    expect(layoutAnswer.default).toBe('single');
  });
});
