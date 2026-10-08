import { targetFor } from '@targets';

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

  it('preselects every default but frontend-design for a library, and keeps the default elsewhere', () => {
    const libraryTarget = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });
    const appTarget = targetFor(DEFAULT_ANSWERS);
    const library = pluginsAnswer.targetDefault([libraryTarget]);
    const app = pluginsAnswer.targetDefault([appTarget]);

    expect(library).toStrictEqual(['ponytail', 'context7']);
    expect(app).toBeUndefined();
  });

  it('keeps the default for a workspace holding any app beside its libraries', () => {
    const libraryTarget = targetFor({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });
    const appTarget = targetFor(DEFAULT_ANSWERS);
    const mixed = pluginsAnswer.targetDefault([libraryTarget, appTarget]);
    const libraries = pluginsAnswer.targetDefault([libraryTarget, libraryTarget]);

    expect(mixed).toBeUndefined();
    expect(libraries).toStrictEqual(['ponytail', 'context7']);
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
