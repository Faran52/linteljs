import {
  mkdir,
  mkdtemp,
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
} from 'vitest';

import { DEFAULT_ANSWERS } from '../answers/answers';
import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
} from '../answers/lintelConfig';
import { emitLintelConfig } from '../emitters/always/lintel-config/lintelConfigEmitter';

import { readLintelConfig } from './readLintelConfig';

let cwd = '';
let external = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-config-'));
  external = await mkdtemp(join(tmpdir(), 'lintel-config-external-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
  await rm(external, {
    recursive: true,
    force: true,
  });
});

const readOptional = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

describe('readLintelConfig', () => {
  it('reads a valid config file', async () => {
    await writeFile(join(cwd, CONFIG_PATH), emitLintelConfig(DEFAULT_ANSWERS), 'utf8');

    await expect(readLintelConfig(cwd)).resolves.toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });

  it('preserves the parse error for malformed JSON', async () => {
    await writeFile(join(cwd, CONFIG_PATH), '{', 'utf8');

    await expect(readLintelConfig(cwd)).rejects.toThrow(/lintel\.config\.json is not valid JSON/);
  });

  it('leaves the config file byte-for-byte unchanged', async () => {
    const text = emitLintelConfig(DEFAULT_ANSWERS);

    await writeFile(join(cwd, CONFIG_PATH), text, 'utf8');
    await readLintelConfig(cwd);

    await expect(readFile(join(cwd, CONFIG_PATH), 'utf8')).resolves.toBe(text);
  });

  it.each([
    ['live', emitLintelConfig(DEFAULT_ANSWERS)],
    ['dangling', null],
  ])('rejects a %s symbolic-link config without touching its target', async (_case, original) => {
    const target = join(external, 'actual-config.json');
    const path = join(cwd, CONFIG_PATH);

    if (original !== null) {
      await writeFile(target, original, 'utf8');
    }

    await symlink(target, path);

    await expect(readLintelConfig(cwd)).rejects.toThrow(
      'lintel.config.json must be a regular file; symbolic links are not allowed',
    );
    await expect(readlink(path)).resolves.toBe(target);
    await expect(readOptional(target)).resolves.toBe(original);
  });

  it('rejects a non-regular config entry before trying to read it', async () => {
    await mkdir(join(cwd, CONFIG_PATH));

    await expect(readLintelConfig(cwd))
      .rejects.toThrow('lintel.config.json must be a regular file');
  });

  it('rejects a directory without a LintelJS config', async () => {
    await expect(readLintelConfig(cwd))
      .rejects.toThrow('lintel.config.json was not found; this is not a LintelJS-managed project');
  });
});
