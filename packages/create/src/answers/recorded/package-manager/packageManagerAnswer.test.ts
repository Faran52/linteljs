import { packageManagerAnswer } from './packageManagerAnswer';

describe('packageManagerAnswer', () => {
  it('is keyed packageManager', () => {
    expect(packageManagerAnswer.key).toBe('packageManager');
  });

  // Detected from the host rather than answered, so there is nothing to ask and nothing to pass.
  it('carries neither a flag nor a prompt', () => {
    expect(packageManagerAnswer).not.toHaveProperty('flag');
    expect(packageManagerAnswer).not.toHaveProperty('prompt');
  });

  it('defaults to a value it offers', () => {
    expect(Object.keys(packageManagerAnswer.values)).toContain(packageManagerAnswer.default);
  });
});
