import { SETUP_TESTS_CANDIDATES } from '../emitters/always/banned-patterns/bannedPatternsEmitter';
import { STYLE_ENTRY_CANDIDATES } from '../emitters/libraries/style-entry/styleEntryPath';
import { type ProjectShape } from '../emitters/projectShape';

import { allPresent } from './utils/fsUtils';

// The one place a directory is read for the files `artifacts/` has more than one spelling of.
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
