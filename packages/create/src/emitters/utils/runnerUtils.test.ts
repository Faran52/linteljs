import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { testRunnerOf } from './runnerUtils';

describe('testRunnerOf', () => {
  it('runs a web target on vitest', () => {
    const answers = answersFor({ target: 'react' });
    const actual = testRunnerOf(answers);
    expect(actual).toBe('vitest');
  });

  it('runs React Native on jest', () => {
    const answers = answersFor({ target: 'react-native' });
    const actual = testRunnerOf(answers);
    expect(actual).toBe('jest');
  });

  it('names none for a project that declined a suite', () => {
    const answers = answersFor({
      target: 'react-native',
      testing: 'none',
    });
    const actual = testRunnerOf(answers);
    expect(actual).toBeUndefined();
  });
});
