import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { emitReactRouterConfig, reactRouterConfigEmitter } from './reactRouterConfigEmitter';

import type { Answers } from '@config/types';

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
    expect(reactRouterConfigEmitter({
      ...HOSTED_DEFAULTS,
      target: 'react',
      router: 'react-router-framework',
    }, EMPTY_PROJECT, 'demo-app')).toEqual([{
      stage: 'package',
      target: 'react-router.config.ts',
      content: { text: emitReactRouterConfig() },
    }]);
    expect(targetsOf({ router: 'react-router' })).toEqual([]);
    expect(targetsOf({})).toEqual([]);
  });

  /*
   * The whole reason the file is written rather than left to its default: React Router looks for `app/`, and every
   * glob this CLI emits reads `src/`.
   */
  it('names src as the source root, so nothing downstream learns a second one', () => {
    expect(emitReactRouterConfig()).toBe([
      "import type { Config } from '@react-router/dev/config';",
      '',
      'export default {',
      '  // `src`, not the default `app`: one source root, the same as every other target this CLI writes.',
      "  appDirectory: 'src',",
      '  ssr: true,',
      '} satisfies Config;',
      '',
    ].join('\n'));
  });
});
