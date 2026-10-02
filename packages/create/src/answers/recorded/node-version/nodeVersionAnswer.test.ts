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

    const matches = pattern.test('26.9.0');
    expect(matches).toBe(true);
    const matches2 = pattern.test('26');
    expect(matches2).toBe(false);
  });
});
