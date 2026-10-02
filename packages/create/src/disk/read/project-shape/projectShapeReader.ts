import { type ProjectShape } from '@config/types';

import { allPresent } from '../../utils/fsUtils';

// Discovered rather than asked: writing the default beside a project's own left a second entry nothing imported.
export const STYLE_ENTRY_CANDIDATES = [
  'src/styles/tailwind.css',
  'src/styles/global.css',
  'src/styles/globals.css',
  'src/styles/index.css',
  'src/app/globals.css',
  'src/styles/main.css',
  'src/global.css',
  'src/globals.css',
  'src/styles.css',
  'src/index.css',
  'src/app.css',
  'src/style.css',
];

const SETUP_TESTS_CANDIDATES = ['__mocks__/setupTests.tsx', '__mocks__/setupTests.ts'];

export const projectShapeReader = async (cwd: string): Promise<ProjectShape> => {
  const [setupTests, styleEntries] = await Promise.all([
    allPresent(cwd, SETUP_TESTS_CANDIDATES),
    allPresent(cwd, STYLE_ENTRY_CANDIDATES),
  ]);

  const shape: ProjectShape = {
    setupTests,
    styleEntries,
  };

  return shape;
};
