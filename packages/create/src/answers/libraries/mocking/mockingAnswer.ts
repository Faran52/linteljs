import type { AnswerRecord } from '../../types';

export type Mocking = keyof typeof mockingAnswer.values;

/**
 * Its own field for the same reason `styling` and `data` are: at most one mocking layer is ever installed, and a
 * single select is what says so.
 *
 * What it turns on is a network that is not there. The starter's api layer answers locally without it, which is
 * what makes the project work offline and in CI; with it the same api layer makes a real request and MSW answers
 * it, at the service worker in the browser and at the request level in the test run. That is the whole point of
 * the layer: the code under test is the code that ships, and the boundary moves rather than the call site.
 */
export const mockingAnswer = {
  key: 'mocking',
  flag: 'mocking',
  prompt: 'API mocking',
  kind: 'optionalChoice',
  none: {
    label: 'None',
    hint: 'The api layer answers locally, with no request to intercept',
  },
  values: {
    msw: {
      label: 'MSW',
      hint: 'Handlers that answer real requests, in the browser and in tests',
    },
  },
} as const satisfies AnswerRecord;
