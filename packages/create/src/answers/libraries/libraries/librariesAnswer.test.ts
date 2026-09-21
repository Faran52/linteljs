import { librariesAnswer } from './librariesAnswer';

describe('librariesAnswer', () => {
  it('is keyed libraries', () => {
    expect(librariesAnswer.key).toBe('libraries');
  });

  it('defaults to values it offers', () => {
    expect(Object.keys(librariesAnswer.values)).toEqual(expect.arrayContaining([...librariesAnswer.default]));
  });
});
