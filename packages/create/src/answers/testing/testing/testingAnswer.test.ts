import { answersFor } from '@mocks/answersFor';

import { targetFor } from '@targets';

import { onlyFor } from '../../utils/recordUtils';

import { testingAnswer } from './testingAnswer';

describe('testingAnswer', () => {
  it('is keyed testing', () => {
    expect(testingAnswer.key).toBe('testing');
  });

  it('defaults to a value it offers', () => {
    const actual = Object.keys(testingAnswer.values);
    expect(actual).toContain(testingAnswer.default);
  });

  it.each([
    ['react', ['vitest', 'none']],
    ['react-native', ['jest', 'none']],
  ] as const)('offers on %s only the runner it runs: %s', (target, expected) => {
    const answers = answersFor({ target });
    const record = targetFor(answers);
    const offered = Object.keys(testingAnswer.values)
      .filter((value) => {
        return onlyFor(testingAnswer, value)?.(record, answers) ?? true;
      });
    expect(offered).toEqual(expected);
  });
});
