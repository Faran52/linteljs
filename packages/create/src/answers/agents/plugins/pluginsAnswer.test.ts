import { DEFAULT_ANSWERS } from '../../registry';

import { pluginsAnswer } from './pluginsAnswer';

describe('pluginsAnswer', () => {
  it('is keyed plugins', () => {
    expect(pluginsAnswer.key).toBe('plugins');
  });

  it('defaults to values it offers', () => {
    const actual = Object.keys(pluginsAnswer.values);
    expect(actual).toEqual(expect.arrayContaining([...pluginsAnswer.default]));
  });

  it('is asked only once an agent has been chosen', () => {
    const withoutAgent = pluginsAnswer.askedWhen({
      ...DEFAULT_ANSWERS,
      agents: [],
    });

    expect(withoutAgent).toBe(false);

    const withAgent = pluginsAnswer.askedWhen({
      ...DEFAULT_ANSWERS,
      agents: ['claude-code'],
    });

    expect(withAgent).toBe(true);
  });
});
