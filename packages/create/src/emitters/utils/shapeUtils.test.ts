import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT } from '@config/constants';

import { projectSpelling, setupTestsPath } from './shapeUtils';

import type { TargetId } from '@config/types';

describe('projectSpelling', () => {
  const CANDIDATES = ['src/styles/global.css', 'src/style.css'];

  it("takes the target's own over another the project also has, whatever the order", () => {
    expect(projectSpelling('src/style.css', CANDIDATES)).toBe('src/style.css');
    expect(projectSpelling('src/style.css', [...CANDIDATES].reverse())).toBe('src/style.css');
  });

  it("takes the project's first when the target's own is not among them", () => {
    expect(projectSpelling('src/index.css', CANDIDATES)).toBe('src/styles/global.css');
  });

  it('takes the default when the project holds none of them', () => {
    expect(projectSpelling('src/style.css', [])).toBe('src/style.css');
    expect(projectSpelling('src/style.css', EMPTY_PROJECT.styleEntries)).toBe('src/style.css');
  });
});

describe('setupTestsPath', () => {
  it.each<[TargetId, string]>([
    ['react', '__mocks__/setupTests.tsx'],
    ['next', '__mocks__/setupTests.tsx'],
    ['vue', '__mocks__/setupTests.ts'],
    ['solid', '__mocks__/setupTests.ts'],
  ])('names the %s setup file %s', (target, path) => {
    expect(setupTestsPath(answersFor({ target }))).toBe(path);
  });

  it('keeps the spelling a project already holds', () => {
    const answers = answersFor({ target: 'react' });

    expect(setupTestsPath(answers, ['__mocks__/setupTests.ts'])).toBe('__mocks__/setupTests.ts');
  });
});
