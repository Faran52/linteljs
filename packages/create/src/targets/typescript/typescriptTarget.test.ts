import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { FOLDER } from '../constants';

import { typescriptTarget } from './typescriptTarget';

describe('the typescript record', () => {
  it('is a library built by tsdown, with no framework and no markup', () => {
    const record = typescriptTarget({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });

    expect(record.libraryProject).toBe(true);
    expect(record.framework).toBeUndefined();
    expect(record.html).toBe(false);
    expect(record.build).toBe('tsdown');
    expect(record.extraScripts).toEqual({ prepack: 'tsdown' });
    expect(record.devDependencies).toEqual(['tsdown']);
  });

  it('typechecks with tsc alone and ignores only its build output', () => {
    const record = typescriptTarget({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });

    expect(record.typecheck).toBe('tsc --noEmit');
    expect(record.gitignore).toEqual(['dist']);
    expect(record.ignores).toEqual([]);
    expect(record.allowBuilds).toEqual([]);
  });

  it('drops every app alias and names folders in kebab case', () => {
    const record = typescriptTarget({
      ...DEFAULT_ANSWERS,
      target: 'typescript',
    });
    const expected = [
      '@components/*',
      '@ui/*',
      '@features/*',
      '@lib/*',
      '@store/*',
      '@utils/*',
      '@services/*',
      '@styles/*',
      '@config/*',
    ];

    expect(record.omitAliases).toEqual(expected);
    expect(record.folderNaming).toEqual({ 'src/**/': FOLDER });
  });
});
