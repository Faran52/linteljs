import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { TARGETS } from '@targets';

import { projectShapeReader, STYLE_ENTRY_CANDIDATES } from './projectShapeReader';

const TARGET_IDS = valuesOf(ANSWERS.target.values);

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-shape-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const plant = async (relative: string): Promise<void> => {
  await mkdir(join(cwd, relative, '..'), { recursive: true });
  await writeFile(join(cwd, relative), '', 'utf8');
};

describe('projectShapeReader', () => {
  it('reads an empty directory as a project holding none of them', async () => {
    expect(await projectShapeReader(cwd)).toEqual({
      setupTests: [],
      styleEntries: [],
    });
  });

  it('answers every spelling the project has, in candidate order', async () => {
    await plant('__mocks__/setupTests.ts');
    await plant('src/style.css');
    await plant('src/styles/global.css');

    expect(await projectShapeReader(cwd)).toEqual({
      setupTests: ['__mocks__/setupTests.ts'],
      styleEntries: ['src/styles/global.css', 'src/style.css'],
    });
  });
});

// A target with no stylesheet of its own contributes nothing to look for.
const targetDefaults = (): string[] => {
  return TARGET_IDS.flatMap((target) => {
    return TARGETS[target]({
      ...DEFAULT_ANSWERS,
      target,
    }).styleEntry ?? [];
  });
};

/**
 * The list is an order rather than a set: `projectSpelling` answers the first candidate present, so which
 * stylesheet a project's entry resolves to is decided here. That ordering is hand-tuned and no registry carries
 * it, which is why the list stays written out and only its membership is checked.
 */
describe('STYLE_ENTRY_CANDIDATES', () => {
  it('reads a target registry with entries in it, so the assertion below is not vacuous', () => {
    expect(targetDefaults().length).toBeGreaterThan(0);
  });

  // Add a target whose stylesheet nobody added here and `projectShapeReader` would never look for it.
  it('looks for every stylesheet a target writes', () => {
    expect(targetDefaults().filter((entry) => {
      return !STYLE_ENTRY_CANDIDATES.includes(entry);
    })).toEqual([]);
  });

  it('carries no duplicate, which would make the order behind it unreachable', () => {
    expect(STYLE_ENTRY_CANDIDATES).toHaveLength(new Set(STYLE_ENTRY_CANDIDATES).size);
  });

  // Tailwind's own entry is what `emitStylelintConfig` and the tailwind layer expect to find first.
  it('prefers the tailwind entry over every other spelling', () => {
    expect(STYLE_ENTRY_CANDIDATES[0]).toBe('src/styles/tailwind.css');
  });
});
