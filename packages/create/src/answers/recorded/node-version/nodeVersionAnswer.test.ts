import { nodeVersionAnswer } from './nodeVersionAnswer';

describe('nodeVersionAnswer', () => {
  it('is keyed nodeVersion', () => {
    expect(nodeVersionAnswer.key).toBe('nodeVersion');
  });

  it('is a text record', () => {
    expect(nodeVersionAnswer.kind).toBe('text');
  });

  it('accepts three fields and refuses a bare major', () => {
    const pattern = new RegExp(nodeVersionAnswer.pattern, 'u');

    const fullMatches = pattern.test('26.9.0');
    expect(fullMatches).toBe(true);
    const majorMatches = pattern.test('26');
    expect(majorMatches).toBe(false);
  });
});
