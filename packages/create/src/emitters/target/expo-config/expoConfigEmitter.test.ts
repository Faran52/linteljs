import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { emitExpoConfig, expoConfigEmitter } from './expoConfigEmitter';

describe('emitExpoConfig', () => {
  it('names the app, its slug and its scheme after the project', () => {
    expect(JSON.parse(emitExpoConfig('Demo-App'))).toStrictEqual({
      expo: {
        name: 'Demo-App',
        slug: 'Demo-App',
        scheme: 'demoapp',
        version: '1.0.0',
        orientation: 'portrait',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        ios: { supportsTablet: true },
        android: { predictiveBackGestureEnabled: false },
        web: {
          bundler: 'metro',
          output: 'static',
        },
        plugins: ['expo-router'],
        experiments: {
          typedRoutes: true,
          reactCompiler: true,
        },
      },
    });
  });
});

describe('expoConfigEmitter', () => {
  it('writes app.json for a react native project', () => {
    const artifacts = expoConfigEmitter({
      ...HOSTED_DEFAULTS,
      target: 'react-native',
    }, EMPTY_PROJECT, 'demo-app');

    const expected = [{
      stage: 'standard',
      target: 'app.json',
      content: { text: emitExpoConfig('demo-app') },
    }];
    expect(artifacts).toEqual(expected);
  });

  it('writes nothing for any other target', () => {
    const expoConfig = expoConfigEmitter(HOSTED_DEFAULTS, EMPTY_PROJECT, 'demo-app');
    expect(expoConfig).toEqual([]);
  });
});
