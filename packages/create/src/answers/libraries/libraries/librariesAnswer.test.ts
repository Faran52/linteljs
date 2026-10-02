import { librariesAnswer } from './librariesAnswer';

describe('librariesAnswer', () => {
  it('is keyed libraries', () => {
    expect(librariesAnswer.key).toBe('libraries');
  });

  it('defaults to values it offers', () => {
    const actual = Object.keys(librariesAnswer.values);
    expect(actual).toEqual(expect.arrayContaining([...librariesAnswer.default]));
  });
});
