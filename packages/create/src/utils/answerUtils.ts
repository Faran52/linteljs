import type {
  Answers,
  Browser,
  Framework,
  Library,
  Surface,
} from '@config/types';

// What an older config means by saying nothing.
const DEFAULT_SURFACES: Surface[] = ['popup', 'background'];

// Next and React Native render with React, so a React-only answer belongs on all three. `framework` keeps them apart
// because each takes its own ESLint layer.
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
  const extra = (answers.browsers ?? [])
    .filter((browser) => {
      return browser !== answers.browser;
    });

  return [answers.browser, ...extra];
};

export const hasTests = (answers: Answers): boolean => {
  return answers.testing !== 'none';
};
