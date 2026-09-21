import { packageManagerAnswer } from './packageManagerAnswer';

describe('packageManagerAnswer', () => {
  it('is keyed packageManager', () => {
    expect(packageManagerAnswer.key).toBe('packageManager');
  });

  it('defaults to a value it offers', () => {
    expect(Object.keys(packageManagerAnswer.values)).toContain(packageManagerAnswer.default);
  });
});
