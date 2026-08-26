import { SETUP_TESTS_CANDIDATES } from '../../artifacts/banned-patterns/checkerArtifact';
import { type ProjectShape } from '../../artifacts/project-shape/projectShape';
import { STYLE_ENTRY_CANDIDATES } from '../../artifacts/style-entry/styleEntryPath';
import { allPresent } from '../utils/fsUtils';

// The one place a directory is read for the files `artifacts/` has more than one spelling of. See `ProjectShape`.
export const readProjectShape = async (cwd: string): Promise<ProjectShape> => {
  const [setupTests, styleEntries] = await Promise.all([
    allPresent(cwd, SETUP_TESTS_CANDIDATES),
    allPresent(cwd, STYLE_ENTRY_CANDIDATES),
  ]);

  return {
    setupTests,
    styleEntries,
  };
};
