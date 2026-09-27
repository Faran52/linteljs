import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { type TargetId } from '@answers';

import { projectSpelling, setupTestsPath } from './shapeUtils';

describe('projectSpelling', () => {
  const CANDIDATES = ['src/styles/global.css', 'src/style.css'];

  // The defect: a project holding the standard's entry and one sorting earlier was read as the earlier one.
  it("takes the target's own over another the project also has, whatever the order", () => {
    expect(projectSpelling('src/style.css', CANDIDATES)).toBe('src/style.css');
    expect(projectSpelling('src/style.css', [...CANDIDATES].reverse())).toBe('src/style.css');
  });

  // The project arranged its files differently, so its own is the one its other files already name.
  it("takes the project's first when the target's own is not among them", () => {
    expect(projectSpelling('src/index.css', CANDIDATES)).toBe('src/styles/global.css');
  });

  // Birth: nothing on disk to prefer, so the target's default is the answer, which is what `EMPTY_PROJECT` gives.
  it('takes the default when the project holds none of them', () => {
    expect(projectSpelling('src/style.css', [])).toBe('src/style.css');
    expect(projectSpelling('src/style.css', EMPTY_PROJECT.styleEntries)).toBe('src/style.css');
  });
});

describe('setupTestsPath', () => {
  // Read off `jsx`, since Solid and Vue set `preserve` and render without a React transform.
  it.each<[TargetId, string]>([
    ['react', '__mocks__/setupTests.tsx'],
    ['next', '__mocks__/setupTests.tsx'],
    ['vue', '__mocks__/setupTests.ts'],
    ['solid', '__mocks__/setupTests.ts'],
  ])('names the %s setup file %s', (target, path) => {
    expect(setupTestsPath(answersFor({ target }))).toBe(path);
  });

  // A project that already holds the other spelling keeps it rather than gaining a second setup file.
  it('keeps the spelling a project already holds', () => {
    const answers = answersFor({ target: 'react' });

    expect(setupTestsPath(answers, ['__mocks__/setupTests.ts'])).toBe('__mocks__/setupTests.ts');
  });
});
