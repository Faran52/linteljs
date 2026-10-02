import { type Artifact, type Emitter } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

// No icons: the starter ships no images, and a path to a missing file fails the first `expo export`.
export const emitExpoConfig = (name: string): string => {
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

// Birth only: the metadata is the project's, and `sync` has no name to key it by.
export const expoConfigEmitter: Emitter = (answers, _project, name): Artifact[] => {
  const { expoProject } = targetFor(answers);

  if (expoProject !== true) {
    return [];
  }

  const config = emitExpoConfig(name);
  const artifacts = [emitted('standard', 'app.json', config)];

  return artifacts;
};
