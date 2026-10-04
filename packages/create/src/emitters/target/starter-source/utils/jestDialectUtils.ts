import {
  STUB_GLOBAL,
  VI_MEMBER,
  VITEST_IMPORT,
} from '../constants';

export const inJestDialect = (source: string): string => {
  return source
    .replace(VITEST_IMPORT, '')
    .replaceAll(STUB_GLOBAL, "jest.spyOn(globalThis, '$<name>').mockImplementation($<value>)")
    .replaceAll('vi.unstubAllGlobals()', 'jest.restoreAllMocks()')
    .replaceAll(VI_MEMBER, 'jest.')
    .trimStart();
};
