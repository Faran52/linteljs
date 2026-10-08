import { DECLARATION_KEY, FOLDER } from '../constants';
import { scriptKeys } from '../utils/namingUtils';
import { filesAt } from '../utils/starterUtils';

import type { TargetBuilder } from '../registry';
import type { TargetRecord } from '../types';

export const typescriptTarget: TargetBuilder = () => {
  const record: TargetRecord = {
    id: 'typescript',
    libraryProject: true,
    noContactPage: true,
    html: false,
    ignores: [],
    gitignore: ['dist'],
    naming: {
      ...scriptKeys(),
      ...DECLARATION_KEY,
    },
    folderNaming: { 'src/**/': FOLDER },
    omitAliases: [
      '@components/*',
      '@ui/*',
      '@features/*',
      '@lib/*',
      '@store/*',
      '@utils/*',
      '@services/*',
      '@styles/*',
      '@config/*',
    ],
    tsconfig: {},
    typecheck: 'tsc --noEmit',
    build: 'tsdown',
    extraScripts: { prepack: 'tsdown' },
    starterFiles: filesAt([
      'src/index.ts',
      'src/model/greeting/greetingModel.ts',
    ]),
    starterTests: [
      {
        target: 'src/model/greeting/greetingModel.test.ts',
        covers: 'src/model/greeting/greetingModel.ts',
      },
    ],
    devDependencies: ['tsdown'],
    allowBuilds: [],
    stateRules: [],
  };

  return record;
};
