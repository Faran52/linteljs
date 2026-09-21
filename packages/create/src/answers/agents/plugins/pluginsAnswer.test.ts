import { DEFAULT_ANSWERS } from '../../registry';

import { pluginsAnswer } from './pluginsAnswer';

describe('pluginsAnswer', () => {
  it('is keyed plugins', () => {
    expect(pluginsAnswer.key).toBe('plugins');
  });

  it('defaults to values it offers', () => {
    expect(Object.keys(pluginsAnswer.values)).toEqual(expect.arrayContaining([...pluginsAnswer.default]));
  });

  it('is asked only once an agent has been chosen', () => {
    expect(pluginsAnswer.askedWhen({
      ...DEFAULT_ANSWERS,
      agents: [],
    })).toBe(false);
    expect(pluginsAnswer.askedWhen({
      ...DEFAULT_ANSWERS,
      agents: ['claude-code'],
    })).toBe(true);
  });
});
