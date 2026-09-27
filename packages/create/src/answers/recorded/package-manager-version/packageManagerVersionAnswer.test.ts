import { packageManagerVersionAnswer } from './packageManagerVersionAnswer';

describe('packageManagerVersionAnswer', () => {
  it('is keyed packageManagerVersion', () => {
    expect(packageManagerVersionAnswer.key).toBe('packageManagerVersion');
  });

  it('is a text record', () => {
    expect(packageManagerVersionAnswer.kind).toBe('text');
  });

  it('accepts three fields and refuses a bare major', () => {
    const pattern = new RegExp(packageManagerVersionAnswer.pattern, 'u');

    expect(pattern.test('12.5.1')).toBe(true);
    expect(pattern.test('12')).toBe(false);
  });
});
