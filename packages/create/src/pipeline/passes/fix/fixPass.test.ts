import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
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
  vi,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';

import { fixPass, nextStep } from './fixPass';

const spawned: string[] = [];

vi.mock('@spawns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spawns')>();

  const localBinarySpawn: typeof actual.localBinarySpawn = async (cwd, name, args, installRoot) => {
    spawned.push(name);

    return await actual.localBinarySpawn(cwd, name, args, installRoot);
  };

  const spawns = {
    ...actual,
    localBinarySpawn,
  };

  return spawns;
});

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-fixpass-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const plantEslint = async (body: string): Promise<void> => {
  const bin = join(cwd, 'node_modules', '.bin');

  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, 'eslint'), `#!/usr/bin/env node\n${body}`, 'utf8');
  await chmod(join(bin, 'eslint'), 0o755);
};

const plantStylelint = async (body: string): Promise<void> => {
  const bin = join(cwd, 'node_modules', '.bin');

  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, 'stylelint'), `#!/usr/bin/env node\n${body}`, 'utf8');
  await chmod(join(bin, 'stylelint'), 0o755);
};

describe('nextStep', () => {
  it('names the install and lint:fix commands for the chosen package manager', () => {
    const actual = nextStep(DEFAULT_ANSWERS);
    expect(actual).toBe('next: pnpm install && pnpm lint:fix');
  });

  it('uses run for a package manager whose script form needs it', () => {
    const step = nextStep({
      ...DEFAULT_ANSWERS,
      packageManager: 'bun',
    });

    expect(step).toBe('next: bun install && bun run lint:fix');
  });
});

describe('fixPass', () => {
  it('reports the next step when there is no eslint binary in the project yet', async () => {
    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = ['next: pnpm install && pnpm lint:fix'];
    expect(notices).toEqual(expected);
  });

  it('looks for eslint once in a single repo, and again at a separate install root', async () => {
    spawned.length = 0;
    await fixPass(cwd, DEFAULT_ANSWERS);
    const single = [...spawned];

    spawned.length = 0;
    const app = join(cwd, 'apps', 'shop');
    await mkdir(app, { recursive: true });
    await fixPass(app, DEFAULT_ANSWERS, undefined, cwd);

    expect(single).toEqual(['eslint']);
    expect(spawned).toEqual(['eslint', 'eslint']);
  });

  it('does nothing observable when no callback is given', async () => {
    const pass = fixPass(cwd, DEFAULT_ANSWERS);
    await expect(pass).resolves.toBeUndefined();
  });

  it.each([
    [
      '[{"filePath":"a.ts","output":"fixed"},{"filePath":"b.ts"}]',
      1,
      'eslint --fix: 1 file changed',
    ],
    [
      '[{"output":"a"},{"output":"b"}]',
      1,
      'eslint --fix: 2 files changed',
    ],
    [
      '[{"filePath":"a.ts"}]',
      0,
      'eslint --fix: nothing to fix',
    ],
    [
      '{"results":[]}',
      0,
      'eslint --fix: nothing to fix',
    ],
  ])('reports what eslint fixed, for %s', async (printed, exitCode, notice) => {
    await plantEslint(`console.log(${JSON.stringify(printed)});\nprocess.exit(${String(exitCode)});\n`);

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = [notice];
    expect(notices).toEqual(expected);
  });

  it('runs eslint over the whole project, fixing, with the JSON formatter', async () => {
    const eslintScript = [
      'const asked = process.argv.slice(2).join(" ");',
      'console.log(asked === ". --fix --format json" ? \'[{"output":"a"}]\' : "[]");',
    ].join('\n');
    await plantEslint(eslintScript);

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = ['eslint --fix: 1 file changed'];
    expect(notices).toEqual(expected);
  });

  it('survives eslint output that is not parseable JSON, counting nothing fixed', async () => {
    await plantEslint('console.log("not json");\nprocess.exit(0);\n');

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = ['eslint --fix: nothing to fix'];
    expect(notices).toEqual(expected);
  });

  it('degrades to a warning rather than throwing when eslint exits with a config failure', async () => {
    await plantEslint('process.exit(2);\n');

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = [
      'eslint --fix could not run; run it yourself once dependencies are installed',
    ];
    expect(notices).toEqual(expected);
  });

  it('runs the stylelint pass over the css glob once eslint has run', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');

    await plantStylelint(
      "require('node:fs').writeFileSync('stylelint-argv', process.argv.slice(2).join(' '));\n",
    );

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const argv = await readFile(join(cwd, 'stylelint-argv'), 'utf8');

    expect(argv).toBe('src/**/*.css --fix --allow-empty-input');
    const expected = ['eslint --fix: nothing to fix', 'stylelint --fix: nothing to fix'];
    expect(notices).toEqual(expected);
  });

  it('counts the style files stylelint rewrote, by their content', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');
    await mkdir(join(cwd, 'src', 'styles'), { recursive: true });
    await writeFile(join(cwd, 'src', 'styles', 'a.css'), 'a {}\n', 'utf8');
    await writeFile(join(cwd, 'src', 'b.css'), 'b {}\n', 'utf8');
    await writeFile(join(cwd, 'src', 'c.css'), 'c {}\n', 'utf8');

    const stylelintScript = [
      "const { writeFileSync } = require('node:fs');",
      "writeFileSync('src/styles/a.css', 'a { }\\n');",
      "writeFileSync('src/c.css', 'c {}\\n');",
    ].join('\n');
    await plantStylelint(stylelintScript);

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = ['eslint --fix: nothing to fix', 'stylelint --fix: 1 file changed'];
    expect(notices).toEqual(expected);
  });

  it('warns rather than throwing when stylelint is present but cannot spawn', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');
    await writeFile(join(cwd, 'node_modules', '.bin', 'stylelint'), 'not a program\n', 'utf8');
    await chmod(join(cwd, 'node_modules', '.bin', 'stylelint'), 0o644);

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = [
      'eslint --fix: nothing to fix',
      'stylelint --fix could not run; run it yourself once dependencies are installed',
    ];
    expect(notices).toEqual(expected);
  });

  it('does not run stylelint at all when there is no binary for it', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');

    const notices: string[] = [];

    await fixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    const expected = ['eslint --fix: nothing to fix'];
    expect(notices).toEqual(expected);
  });

  it('runs the app\'s own eslint once, without looking at the install root', async () => {
    await plantEslint("console.log('[]');\n");
    spawned.length = 0;

    await fixPass(cwd, DEFAULT_ANSWERS, undefined, join(cwd, 'root'));

    const expected = [
      'eslint',
      'stylelint',
      'stylelint',
    ];
    expect(spawned).toEqual(expected);
  });

  it('runs the binaries hoisted to the install root inside the app', async () => {
    const app = join(cwd, 'apps', 'shop');
    await mkdir(app, { recursive: true });
    await plantEslint("require('node:fs').writeFileSync('eslint-cwd', process.cwd());\nconsole.log('[]');\n");
    await plantStylelint("require('node:fs').writeFileSync('stylelint-cwd', process.cwd());\n");

    const notices: string[] = [];

    await fixPass(app, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    }, cwd);

    const directory = await realpath(app);
    const eslintCwd = await readFile(join(app, 'eslint-cwd'), 'utf8');
    const stylelintCwd = await readFile(join(app, 'stylelint-cwd'), 'utf8');
    expect(eslintCwd).toBe(directory);
    expect(stylelintCwd).toBe(directory);
    const expected = ['eslint --fix: nothing to fix', 'stylelint --fix: nothing to fix'];
    expect(notices).toEqual(expected);
  });
});
