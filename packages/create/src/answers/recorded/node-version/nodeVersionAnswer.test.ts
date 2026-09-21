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

    expect(pattern.test('26.9.0')).toBe(true);
    expect(pattern.test('26')).toBe(false);
  });
});
