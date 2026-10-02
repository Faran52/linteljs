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

    const targets = targetsOf({ router: 'react-router' });
    expect(targets).toEqual([]);
    const targets2 = targetsOf({});
    expect(targets2).toEqual([]);
  });

  it('names src as the source root, so nothing downstream learns a second one', () => {
    const reactRouterConfig = emitReactRouterConfig();

    expect(reactRouterConfig).toBe([
      "import type { Config } from '@react-router/dev/config';",
      '',
      'export default {',
      "  appDirectory: 'src',",
      '  ssr: true,',
      '} satisfies Config;',
      '',
    ].join('\n'));
  });
});
