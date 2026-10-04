import {
  type Artifact,
  type Emitter,
  type Language,
} from '@config/types';

import { localesOf } from '@utils/answerUtils';
import { unscopedName } from '@utils/nameUtils';

import { targetFor } from '@targets';

import { LANGUAGE_NAMES } from '../../libraries/i18n-config/constants';
import { emitted } from '../../utils/artifactUtils';

// No icons: the starter ships no images, and a path to a missing file fails the first `expo export`.
// Declared locales are what iOS reports the device's language against, and what each system's per-app setting lists.
export const emitExpoConfig = (name: string, locales: Language[]): string => {
  const localization = locales.length === 0 ? [] : [['expo-localization', { supportedLocales: locales }]];
  // SDK 57's native RTL switch, read by Expo Go and by the plugin in a build; both lay out by the device's language.
  const rtl = locales
    .some((language) => {
      return LANGUAGE_NAMES[language].dir === 'rtl';
    });
  const config = {
    expo: {
      name,
      // A scheme is a URL host, so it carries neither separators nor case.
      slug: name,
      scheme: name
        .replaceAll(/[^a-z0-9]/gi, '')
        .toLowerCase(),
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
      ...(rtl ? { extra: { supportsRTL: true } } : {}),
      plugins: ['expo-router', ...localization],
      // `typedRoutes` is what makes `Href` a union of this project's own routes rather than a string.
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
    },
  };

  return `${JSON.stringify(config, null, 2)}\n`;
};

// Birth only: the metadata is the project's, and `sync` has no name to key it by.
export const expoConfigEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { expoProject } = targetFor(answers);

  if (expoProject !== true) {
    return [];
  }

  const config = emitExpoConfig(unscopedName(name), localesOf(answers));
  const artifacts = [emitted('standard', 'app.json', config)];

  return artifacts;
};
