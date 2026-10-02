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
  }, EMPTY_PROJECT, 'demo-app')
    .map((artifact) => {
      return artifact.target;
    });
};

describe('reactRouterConfigEmitter', () => {
  it('writes only for framework mode, which is the one answer that reads the file', () => {
    const artifacts = reactRouterConfigEmitter({
      ...HOSTED_DEFAULTS,
      target: 'react',
      router: 'react-router-framework',
    }, EMPTY_PROJECT, 'demo-app');

    const expected = [{
      stage: 'package',
      target: 'react-router.config.ts',
      content: { text: emitReactRouterConfig() },
    }];
    expect(artifacts).toEqual(expected);

    const libraryModeTargets = targetsOf({ router: 'react-router' });
    expect(libraryModeTargets).toEqual([]);
    const routerlessTargets = targetsOf({});
    expect(routerlessTargets).toEqual([]);
  });

  it('names src as the source root, so nothing downstream learns a second one', () => {
    const reactRouterConfig = emitReactRouterConfig();

    const expected = [
      "import type { Config } from '@react-router/dev/config';",
      '',
      'export default {',
      "  appDirectory: 'src',",
      '  ssr: true,',
      '} satisfies Config;',
      '',
    ].join('\n');
    expect(reactRouterConfig).toBe(expected);
  });
});
