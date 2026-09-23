import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

/**
 * Expo's own project file, which names the application, its scheme and the plugins its build loads. Written rather
 * than copied because three of its fields are the project's name, and a template with a placeholder in it would be
 * a placeholder in three places.
 *
 * The icons `create-expo` points at are absent on purpose: the starter ships no images, and a path to a file that
 * is not there fails the first `expo export`. A project adds its own and names them here.
 */
export const emitExpoConfig = (name: string): string => {
  const config = {
    expo: {
      name,
      // A scheme is a URL host, so it carries neither separators nor case.
      slug: name,
      scheme: name.replaceAll(/[^a-z0-9]/gi, '').toLowerCase(),
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
      // `typedRoutes` is what makes `Href` a union of this project's own routes rather than a string.
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
    },
  };

  return `${JSON.stringify(config, null, 2)}\n`;
};

// Birth only: a project's application metadata is its own from its first run, and `sync` has no name to key it by.
export const expoConfigEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { expoProject } = targetFor(answers);

  return expoProject === true ? [emitted('standard', 'app.json', emitExpoConfig(name))] : [];
};
