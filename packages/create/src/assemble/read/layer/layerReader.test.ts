import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { type Given, layerReader } from './layerReader';

const TREE: Record<string, string> = {
  'kit/react/base/ui/button/Button.tsx': '',
  'kit/react/base/ui/button/Button.test.tsx': '',
  'kit/react/base/styling/css/ui/button/Button.css': '',
  'kit/react/base/styling/tailwind/ui/button/Button.styles.ts': '',
  'kit/react/form/share.json': '{ "groups": { "libraries": ["react-hook-form", "tanstack-form"] } }',
  'kit/react/form/libraries/apis/contact/contactSchema.ts': '',
  'kit/react/form/server-actions/apis/contact/contactAction.ts': '',
  'kit/react/libraries/zod-off/apis/contact/contactCheck.ts': '',
  'kit/react/libraries/ts-pattern-off/apis/contact/match.ts': '',
  'kit/react/platform/web/public/robots.txt': '',
  'kit/react/platform/native/app.json': '',
  'kit/react/data/fetch/share.json': '{ "dependencies": ["qs"] }',
  'kit/react/e2e/playwright/e2e/home.spec.ts': '',
};

const GIVEN: Given = {
  styling: ['css'],
  form: ['react-hook-form'],
  libraries: ['ts-pattern'],
  data: ['fetch'],
  e2e: [],
  platform: ['web'],
};

describe('layerReader', () => {
  let root = '';

  beforeEach(async () => {
    const prefix = join(tmpdir(), 'layer-reader-');

    root = await mkdtemp(prefix);

    const writes = Object.entries(TREE)
      .map(async ([path, text]) => {
        const file = join(root, path);

        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, text, 'utf8');
      });

    await Promise.all(writes);
  });

  afterEach(async () => {
    await rm(root, {
      recursive: true,
      force: true,
    });
  });

  it('reads base and each folder its answers, groups, absences and facts pick, less nested folders', async () => {
    const drawn = await layerReader(root, 'kit/react', GIVEN, true);
    const read = drawn
      .map(({ name, files }) => {
        const paths = files
          .map(({ path }) => {
            return path;
          });

        const entry: [string, string[]] = [name, paths];

        return entry;
      });

    const byName = Object.fromEntries(read);

    expect(byName).toEqual({
      'kit/react': [],
      'kit/react/base': ['ui/button/Button.test.tsx', 'ui/button/Button.tsx'],
      'kit/react/base/styling/css': ['ui/button/Button.css'],
      'kit/react/data/fetch': [],
      'kit/react/form/libraries': ['apis/contact/contactSchema.ts'],
      'kit/react/libraries/zod-off': ['apis/contact/contactCheck.ts'],
      'kit/react/platform/web': ['public/robots.txt'],
    });
  });

  it('carries each folder share and leaves tests out where asked', async () => {
    const drawn = await layerReader(root, 'kit/react', GIVEN, false);
    const base = drawn
      .find(({ name }) => {
        return name === 'kit/react/base';
      });
    const fetch = drawn
      .find(({ name }) => {
        return name === 'kit/react/data/fetch';
      });
    const paths = base?.files
      .map(({ path }) => {
        return path;
      });

    expect(paths).toEqual(['ui/button/Button.tsx']);
    expect(fetch?.share).toEqual({ dependencies: ['qs'] });
  });

  it('refuses a question share that is not an object', async () => {
    await writeFile(join(root, 'kit/react/form/share.json'), '[]', 'utf8');

    const reading = layerReader(root, 'kit/react', GIVEN, true);

    await expect(reading).rejects.toThrow('kit/react/form/share.json is not an object');
  });
});
