import { packageManagerAnswer } from './packageManagerAnswer';

describe('packageManagerAnswer', () => {
  it('is keyed packageManager', () => {
    expect(packageManagerAnswer.key).toBe('packageManager');
  });

  it('carries neither a flag nor a prompt', () => {
    expect(packageManagerAnswer).not.toHaveProperty('flag');
    expect(packageManagerAnswer).not.toHaveProperty('prompt');
  });

  it('defaults to a value it offers', () => {
    const actual = Object.keys(packageManagerAnswer.values);
    expect(actual).toContain(packageManagerAnswer.default);
  });
});
