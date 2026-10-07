import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env, execPath } from 'node:process';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { E2eRegistry } from '@e2e/registry/registry';

let root: string;
let registry: E2eRegistry;

const answer = (text: string): void => {
  const path = join(root, 'answer.txt');

  writeFileSync(path, text);
};

const freshPasses = async (): Promise<typeof import('./passesUtils.ts')> => {
  vi.resetModules();

  const passes = await import('./passesUtils.ts');

  return passes;
};

beforeEach(() => {
  const prefix = join(tmpdir(), 'passes-');

  root = mkdtempSync(prefix);

  registry = {
    url: 'http://registry.test/',
    version: '0.0.0',
    cliBin: '',
    cacheDir: join(root, 'cache'),
    runDir: root,
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

describe('NPM', () => {
  it('runs npm from PATH by default', async () => {
    vi.stubEnv('COLLECT_NPM', undefined);

    const { NPM } = await freshPasses();

    expect(NPM).toEqual(['npm', []]);
  });

  it('runs the CLI COLLECT_NPM names through node', async () => {
    vi.stubEnv('COLLECT_NPM', '/opt/npm/cli.js');

    const { NPM } = await freshPasses();

    expect(NPM).toEqual([execPath, ['/opt/npm/cli.js']]);
  });
});

describe('installCommand', () => {
  it('installs with pnpm itself', async () => {
    const { installCommand } = await freshPasses();

    const command = installCommand('pnpm');

    expect(command).toEqual(['pnpm', ['install']]);
  });

  it('installs through the CLI COLLECT_NPM names, without audit or fund', async () => {
    vi.stubEnv('COLLECT_NPM', '/opt/npm/cli.js');

    const { installCommand } = await freshPasses();

    const command = installCommand('npm');

    expect(command).toEqual([execPath, [
      '/opt/npm/cli.js',
      'install',
      '--no-audit',
      '--no-fund',
    ]]);
  });
});

describe('run', () => {
  it('answers stdout before stderr, with the registry and caches in the environment', async () => {
    vi.stubEnv('npm_config_user_agent', undefined);
    const { run } = await freshPasses();
    const script = [
      'console.error("err");',
      'const e = process.env;',
      'console.log([e.npm_config_registry, e.NPM_CONFIG_REGISTRY, e.pnpm_config_registry].join(" "));',
      'console.log(e.pnpm_config_minimum_release_age_exclude);',
      'console.log(e.npm_config_cache, e.pnpm_config_store_dir, e.npm_config_user_agent);',
    ].join('\n');

    const output = await run(execPath, ['-e', script], root, registry);

    const expected = [
      'http://registry.test/ http://registry.test/ http://registry.test/',
      '["@linteljs/*"]',
      `${join(root, 'cache', 'npm')} ${join(root, 'cache', 'pnpm-store')} undefined`,
      'err',
      '',
    ].join('\n');
    expect(output).toBe(expected);
  });

  it('passes the user agent it is given', async () => {
    const { run } = await freshPasses();

    const script = 'console.log(process.env.npm_config_user_agent)';

    const output = await run(execPath, ['-e', script], root, registry, 'pnpm/12');

    expect(output).toBe('pnpm/12\n');
  });
});

describe('PASSES.pnpm', () => {
  it('clears the allowBuilds block and keeps the rest', async () => {
    const { PASSES } = await freshPasses();
    const path = join(root, 'pnpm-workspace.yaml');
    writeFileSync(path, 'packages: []\nallowBuilds:\n  esbuild: true\n  sharp: true\ncatalog: {}\n');

    PASSES.pnpm.clear(root);

    const cleared = readFileSync(path, 'utf8');
    expect(cleared).toBe('packages: []\nallowBuilds: {}\ncatalog: {}\n');
  });

  it.each([
    [
      'the ignored builds pnpm lists',
      'Done\nAutomatically ignored builds during installation:\n  esbuild\n  sharp\nhint\n',
      ['esbuild', 'sharp'],
    ],
    [
      'nothing when pnpm lists none',
      'Done\n',
      [],
    ],
  ])('lists %s', async (_label, listing, expected) => {
    const bin = join(root, 'bin');
    const pnpm = join(bin, 'pnpm');
    vi.stubEnv('PATH', `${bin}:${env['PATH'] ?? ''}`);
    mkdirSync(bin);
    writeFileSync(pnpm, '#!/bin/sh\ncat answer.txt\n');
    chmodSync(pnpm, 0o755);
    answer(listing);
    const { PASSES } = await freshPasses();

    const names = await PASSES.pnpm.list(root, registry);

    expect(names).toEqual(expected);
  });
});

describe('PASSES.npm', () => {
  it('drops allowScripts from package.json', async () => {
    const { PASSES } = await freshPasses();
    const path = join(root, 'package.json');
    writeFileSync(path, '{"name":"a","allowScripts":{"x":true}}');

    PASSES.npm.clear(root);

    const cleared = readFileSync(path, 'utf8');
    expect(cleared).toBe('{\n  "name": "a"\n}\n');
  });

  it.each([
    [
      'the names npm allows',
      'notice\n{"allowScripts":[{"name":"a"},{"name":"b"}]}',
      ['a', 'b'],
    ],
    [
      'nothing for prose',
      'Unknown command',
      [],
    ],
    [
      'nothing for JSON of another shape',
      '{"allowScripts":{}}',
      [],
    ],
  ])('lists %s', async (_label, listing, expected) => {
    const cli = join(root, 'npm.mjs');
    writeFileSync(cli, 'import { readFileSync } from "node:fs";\nprocess.stdout.write(readFileSync("answer.txt"));\n');
    answer(listing);
    vi.stubEnv('COLLECT_NPM', cli);
    const { PASSES } = await freshPasses();

    const names = await PASSES.npm.list(root, registry);

    expect(names).toEqual(expected);
  });

  it('warns with the start of a listing that is not JSON', async () => {
    const cli = join(root, 'npm.mjs');
    writeFileSync(cli, 'import { readFileSync } from "node:fs";\nprocess.stdout.write(readFileSync("answer.txt"));\n');
    answer(`{${'x'.repeat(500)}`);
    vi.stubEnv('COLLECT_NPM', cli);
    const warn = vi.spyOn(console, 'warn').mockReturnValue();
    const { PASSES } = await freshPasses();

    const names = await PASSES.npm.list(root, registry);

    expect(names).toEqual([]);
    expect(warn).toHaveBeenCalledWith(`[WARN] npm install-scripts ls answered no JSON:\n{${'x'.repeat(399)}`);
  });
});
