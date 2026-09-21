import { agentsAnswer } from './agentsAnswer';

describe('agentsAnswer', () => {
  it('is keyed agents', () => {
    expect(agentsAnswer.key).toBe('agents');
  });

  it('defaults to values it offers', () => {
    expect(Object.keys(agentsAnswer.values)).toEqual(expect.arrayContaining([...agentsAnswer.default]));
  });
});
