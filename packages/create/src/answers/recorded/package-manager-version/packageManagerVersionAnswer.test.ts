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

    const fullMatches = pattern.test('12.5.1');
    expect(fullMatches).toBe(true);
    const majorMatches = pattern.test('12');
    expect(majorMatches).toBe(false);
  });
});
