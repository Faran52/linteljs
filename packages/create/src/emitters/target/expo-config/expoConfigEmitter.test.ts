import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { emitExpoConfig, expoConfigEmitter } from './expoConfigEmitter';

const SCENE_SUPPORT = ['expo-build-properties', { ios: { enableSceneSupport: true } }];
const DAEMON_JVM = './src/config-plugins/with-gradle-daemon-jvm/withGradleDaemonJvm.ts';
const SPLASH_SCREEN = ['expo-splash-screen', {
  image: './assets/images/splash.png',
  imageWidth: 200,
  backgroundColor: '#faf9f7',
  dark: {
    image: './assets/images/splash-dark.png',
    backgroundColor: '#1f2128',
  },
}];

describe('emitExpoConfig', () => {
  it('names the app, its slug and its scheme after the project', () => {
    const parsed: unknown = JSON.parse(emitExpoConfig('Demo-App', []));

    expect(parsed).toStrictEqual({
      expo: {
        name: 'Demo-App',
        slug: 'Demo-App',
        scheme: 'demoapp',
        version: '1.0.0',
        orientation: 'portrait',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        icon: './assets/images/icon.png',
        ios: {
          supportsTablet: true,
          icon: {
            light: './assets/images/icon.png',
            dark: './assets/images/icon-dark.png',
          },
        },
        android: {
          predictiveBackGestureEnabled: false,
          adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-foreground.png',
            backgroundColor: '#faf9f7',
          },
        },
        web: {
          bundler: 'metro',
          output: 'static',
        },
        plugins: [
          'expo-router',
          SCENE_SUPPORT,
          DAEMON_JVM,
          SPLASH_SCREEN,
        ],
        experiments: {
          typedRoutes: true,
          reactCompiler: true,
        },
      },
    });
  });

  it('declares the locales to expo-localization', () => {
    const parsed: unknown = JSON.parse(emitExpoConfig('demo', ['en', 'ar']));

    const expected = {
      expo: {
        plugins: [
          'expo-router',
          SCENE_SUPPORT,
          DAEMON_JVM,
          SPLASH_SCREEN,
          ['expo-localization', {
            supportedLocales: {
              ios: ['en', 'ar'],
              android: ['en', 'ar'],
            },
          }],
        ],
      },
    };
    expect(parsed).toMatchObject(expected);
  });

  it('declares Chinese to iOS by its script', () => {
    const parsed: unknown = JSON.parse(emitExpoConfig('demo', ['zh-CN', 'zh-TW']));

    const expected = {
      expo: {
        plugins: [
          'expo-router',
          SCENE_SUPPORT,
          DAEMON_JVM,
          SPLASH_SCREEN,
          ['expo-localization', {
            supportedLocales: {
              ios: ['zh-Hans', 'zh-Hant'],
              android: ['zh-CN', 'zh-TW'],
            },
          }],
        ],
      },
    };
    expect(parsed).toMatchObject(expected);
  });

  it('turns on native right to left with a right-to-left language, and only then', () => {
    const arabic: unknown = JSON.parse(emitExpoConfig('demo', ['en', 'ar']));
    const japanese: unknown = JSON.parse(emitExpoConfig('demo', ['en', 'ja']));

    const expected = { expo: { extra: { supportsRTL: true } } };
    expect(arabic).toMatchObject(expected);
    expect(japanese).not.toHaveProperty('expo.extra');
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
      content: { text: emitExpoConfig('demo-app', []) },
    }];
    expect(artifacts).toEqual(expected);
  });

  it('declares every chosen language, English first', () => {
    const artifacts = expoConfigEmitter({
      ...HOSTED_DEFAULTS,
      target: 'react-native',
      languages: ['ar', 'ja'],
    }, EMPTY_PROJECT, 'demo-app');

    const expected = [{
      stage: 'standard',
      target: 'app.json',
      content: { text: emitExpoConfig('demo-app', [
        'en',
        'ar',
        'ja',
      ]) },
    }];
    expect(artifacts).toEqual(expected);
  });

  it('writes nothing for any other target', () => {
    const expoConfig = expoConfigEmitter(HOSTED_DEFAULTS, EMPTY_PROJECT, 'demo-app');
    expect(expoConfig).toEqual([]);
  });
});
