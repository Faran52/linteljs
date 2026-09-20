import type { Framework } from '../../config/types';
import type { Library } from '../libraries/libraries/librariesAnswer';
import type { Answers } from '../registry';
import type { Browser } from '../target/browser/browserAnswer';
import type { Surface } from '../target/surfaces/surfacesAnswer';

// What an older config means by saying nothing.
const DEFAULT_SURFACES: Surface[] = ['popup', 'background'];

/**
 * Next and React Native render with React, so a React-only answer belongs on all three. `framework` keeps them apart
 * because each takes its own ESLint layer; asking `=== 'react'` instead refused React Hook Form on the two of them,
 * while the TanStack binding map in `emitPackageJson` had always handed all three `@tanstack/react-form`.
 */
export const rendersWithReact = (framework: Framework | undefined): boolean => {
  return framework === 'react' || framework === 'next' || framework === 'react-native';
};

export const hasLibrary = (answers: Answers, library: Library): boolean => {
  return answers.libraries.includes(library);
};

export const surfacesOf = (answers: Answers): Surface[] => {
  return answers.surfaces ?? DEFAULT_SURFACES;
};

export const hasSurface = (answers: Answers, surface: Surface): boolean => {
  return surfacesOf(answers).includes(surface);
};

// `browser` first, so the primary one keeps writing `manifest.json`.
export const browsersOf = (answers: Answers): Browser[] => {
  const extra = (answers.browsers ?? []).filter((browser) => {
    return browser !== answers.browser;
  });

  return [answers.browser, ...extra];
};

export const hasTests = (answers: Answers): boolean => {
  return answers.testing !== 'none';
};
