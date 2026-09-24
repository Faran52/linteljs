import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers } from '#answers';
import { EMPTY_PROJECT } from '#config/constants';

import { emitReactRouterConfig, reactRouterConfigEmitter } from './reactRouterConfigEmitter';

import { HOSTED_DEFAULTS } from '#mocks/hostedAnswers';

const targetsOf = (overrides: Partial<Answers>): string[] => {
  return reactRouterConfigEmitter({
    ...HOSTED_DEFAULTS,
    target: 'react',
    ...overrides,
  }, EMPTY_PROJECT, 'demo-app').map((artifact) => {
    return artifact.target;
  });
};

describe('reactRouterConfigEmitter', () => {
  it('writes only for framework mode, which is the one answer that reads the file', () => {
    expect(targetsOf({ router: 'react-router-framework' })).toEqual(['react-router.config.ts']);
    expect(targetsOf({ router: 'react-router' })).toEqual([]);
    expect(targetsOf({})).toEqual([]);
  });

  /*
   * The whole reason the file is written rather than left to its default: React Router looks for `app/`, and every
   * glob this CLI emits reads `src/`.
   */
  it('names src as the source root, so nothing downstream learns a second one', () => {
    expect(emitReactRouterConfig()).toContain("appDirectory: 'src'");
    expect(emitReactRouterConfig()).toContain('ssr: true');
  });
});
