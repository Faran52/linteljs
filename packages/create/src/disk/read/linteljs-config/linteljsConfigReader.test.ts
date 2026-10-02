import { execFileSync } from 'node:child_process';
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  rm,
  symlink,
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
  vi,
} from 'vitest';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_ANSWERS,
  LEGACY_CONFIG_PATH,
} from '@answers';
import { emitLinteljsConfig } from '@emitters/always/linteljs-config/linteljsConfigEmitter';

import { readIfPresent } from '../../utils/fsUtils';

import { linteljsConfigReader } from './linteljsConfigReader';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();

  return {
    ...actual,
    lstat: vi.fn(actual.lstat),
  };
});

let cwd = '';
let external = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'linteljs-config-'));
  external = await mkdtemp(join(tmpdir(), 'linteljs-config-external-'));
});

afterEach(async () => {
  vi.mocked(lstat).mockRestore();

  await rm(cwd, {
    recursive: true,
    force: true,
  });

  await rm(external, {
    recursive: true,
    force: true,
  });
});

describe('linteljsConfigReader', () => {
  it('reads a valid config file', async () => {
    await writeFile(join(cwd, CONFIG_PATH), emitLinteljsConfig(DEFAULT_ANSWERS), 'utf8');

    const linteljsConfig = await linteljsConfigReader(cwd);
    const expected = {
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    };
    expect(linteljsConfig).toEqual(expected);
  });

  it('preserves the parse error for malformed JSON', async () => {
    await writeFile(join(cwd, CONFIG_PATH), '{', 'utf8');

    const linteljsConfigPromise = linteljsConfigReader(cwd);
    await expect(linteljsConfigPromise).rejects.toThrow(/linteljs\.config\.json is not valid JSON/);
  });

  it('leaves the config file byte-for-byte unchanged', async () => {
    const text = emitLinteljsConfig(DEFAULT_ANSWERS);

    await writeFile(join(cwd, CONFIG_PATH), text, 'utf8');
    await linteljsConfigReader(cwd);

    const file = await readFile(join(cwd, CONFIG_PATH), 'utf8');
    expect(file).toBe(text);
  });

  it.each([
    ['live', emitLinteljsConfig(DEFAULT_ANSWERS)],
    ['dangling', null],
  ])('rejects a %s symbolic-link config without touching its target', async (_case, original) => {
    const target = join(external, 'actual-config.json');
    const path = join(cwd, CONFIG_PATH);

    if (original !== null) {
      await writeFile(target, original, 'utf8');
    }

    await symlink(target, path);

    const linteljsConfigPromise = linteljsConfigReader(cwd);

    await expect(linteljsConfigPromise).rejects.toThrow(
      'linteljs.config.json must be a regular file; symbolic links are not allowed',
    );

    const actual = await readlink(path);
    expect(actual).toBe(target);
    const file = await readIfPresent(target);
    expect(file).toBe(original);
  });

  it('rejects a non-regular config entry before trying to read it', async () => {
    await mkdir(join(cwd, CONFIG_PATH));

    const linteljsConfigPromise = linteljsConfigReader(cwd);

    await expect(linteljsConfigPromise)
      .rejects.toThrow('linteljs.config.json must be a regular file');
  });

  it('reads the name older versions wrote when the current one is absent', async () => {
    await writeFile(join(cwd, LEGACY_CONFIG_PATH), emitLinteljsConfig(DEFAULT_ANSWERS), 'utf8');

    const linteljsConfig = await linteljsConfigReader(cwd);
    const expected = {
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    };
    expect(linteljsConfig).toEqual(expected);
  });

  it('prefers the current name when both are on disk', async () => {
    await writeFile(join(cwd, LEGACY_CONFIG_PATH), '{ not json', 'utf8');
    await writeFile(join(cwd, CONFIG_PATH), emitLinteljsConfig(DEFAULT_ANSWERS), 'utf8');

    const linteljsConfig = await linteljsConfigReader(cwd);
    expect(linteljsConfig).toHaveProperty('target', DEFAULT_ANSWERS.target);
  });

  it('closes the file it reads', async () => {
    await writeFile(join(cwd, CONFIG_PATH), emitLinteljsConfig(DEFAULT_ANSWERS), 'utf8');

    const before = (await readdir('/dev/fd')).length;

    await linteljsConfigReader(cwd);
    await linteljsConfigReader(cwd);

    const entries = await readdir('/dev/fd');
    expect(entries).toHaveLength(before);
  });

  it('rejects a named pipe without opening it', async () => {
    execFileSync('/usr/bin/mkfifo', [join(cwd, CONFIG_PATH)]);

    const linteljsConfigPromise = linteljsConfigReader(cwd);
    await expect(linteljsConfigPromise).rejects.toThrow('linteljs.config.json must be a regular file');
  });

  it('passes on a failure to read that is not absence', async () => {
    vi.mocked(lstat).mockRejectedValueOnce(Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }));

    const linteljsConfigPromise = linteljsConfigReader(cwd);
    await expect(linteljsConfigPromise).rejects.toThrow('EACCES: permission denied');
  });

  describe('an entry swapped after it was checked', () => {
    const checkedAsRegular = async (): Promise<void> => {
      const regular = await lstat(join(external, 'regular.json'));

      vi.mocked(lstat).mockResolvedValue(regular);
    };

    beforeEach(async () => {
      await writeFile(join(external, 'regular.json'), '{}', 'utf8');
    });

    it('refuses a directory it opened', async () => {
      await mkdir(join(cwd, CONFIG_PATH));
      await checkedAsRegular();

      const linteljsConfigPromise = linteljsConfigReader(cwd);
      await expect(linteljsConfigPromise).rejects.toThrow(/^linteljs\.config\.json must be a regular file$/u);
    });

    it('refuses a symbolic link it was about to follow', async () => {
      await symlink(join(external, 'regular.json'), join(cwd, CONFIG_PATH));
      await checkedAsRegular();

      const linteljsConfigPromise = linteljsConfigReader(cwd);

      await expect(linteljsConfigPromise).rejects.toThrow(
        'linteljs.config.json must be a regular file; symbolic links are not allowed',
      );
    });
  });

  it('rejects a directory without a LintelJS config', async () => {
    const linteljsConfigPromise = linteljsConfigReader(cwd);

    await expect(linteljsConfigPromise)
      .rejects.toThrow('linteljs.config.json was not found; this is not a LintelJS-managed project');
  });
});
