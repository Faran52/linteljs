import { agentsAnswer } from './agentsAnswer';

describe('agentsAnswer', () => {
  it('is keyed agents', () => {
    expect(agentsAnswer.key).toBe('agents');
  });

  it('defaults to values it offers', () => {
    const actual = Object.keys(agentsAnswer.values);
    expect(actual).toEqual(expect.arrayContaining([...agentsAnswer.default]));
  });
});
