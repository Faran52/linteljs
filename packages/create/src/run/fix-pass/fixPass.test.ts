import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
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

import { DEFAULT_ANSWERS } from '../../model/answers/answers';

import { nextStep, runFixPass } from './fixPass';

let cwd = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-fixpass-'));
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
    expect(nextStep(DEFAULT_ANSWERS)).toBe('next: pnpm install && pnpm lint:fix');
  });

  it('uses run for a package manager whose script form needs it', () => {
    expect(nextStep({
      ...DEFAULT_ANSWERS,
      packageManager: 'bun',
    }))
      .toBe('next: bun install && bun run lint:fix');
  });
});

describe('runFixPass', () => {
  it('reports the next step when there is no eslint binary in the project yet', () => {
    const notices: string[] = [];

    runFixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    expect(notices).toEqual(['next: pnpm install && pnpm lint:fix']);
  });

  it('does nothing observable when no callback is given', () => {
    expect(() => {
      runFixPass(cwd, DEFAULT_ANSWERS);
    }).not.toThrow();
  });

  it.each([
    [
      '[{"filePath":"a.ts","output":"fixed"},{"filePath":"b.ts"}]',
      1,
      'eslint --fix: 1 file changed',
    ],
    ['[{"output":"a"},{"output":"b"}]', 1, 'eslint --fix: 2 files changed'],
    ['[{"filePath":"a.ts"}]', 0, 'eslint --fix: nothing to fix'],
  ])('reports what eslint fixed, for %s', async (printed, exitCode, notice) => {
    await plantEslint(`console.log(${JSON.stringify(printed)});\nprocess.exit(${String(exitCode)});\n`);

    const notices: string[] = [];

    runFixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    expect(notices).toEqual([notice]);
  });

  it('survives eslint output that is not parseable JSON, counting nothing fixed', async () => {
    await plantEslint('console.log("not json");\nprocess.exit(0);\n');

    const notices: string[] = [];

    runFixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    expect(notices).toEqual(['eslint --fix: nothing to fix']);
  });

  it('degrades to a warning rather than throwing when eslint exits with a config failure', async () => {
    await plantEslint('process.exit(2);\n');

    const notices: string[] = [];

    runFixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    expect(notices).toEqual([
      'eslint --fix could not run; run it yourself once dependencies are installed',
    ]);
  });

  it('runs the stylelint pass over the css glob once eslint has run', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');
    await plantStylelint(
      "require('node:fs').writeFileSync('stylelint-argv', process.argv.slice(2).join(' '));\n",
    );

    runFixPass(cwd, DEFAULT_ANSWERS, () => {
      return undefined;
    });

    expect(await readFile(join(cwd, 'stylelint-argv'), 'utf8'))
      .toBe('src/**/*.css --fix --allow-empty-input');
  });

  it('warns rather than throwing when stylelint is present but cannot spawn', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');
    await writeFile(join(cwd, 'node_modules', '.bin', 'stylelint'), 'not a program\n', 'utf8');
    await chmod(join(cwd, 'node_modules', '.bin', 'stylelint'), 0o644);

    const notices: string[] = [];

    runFixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    expect(notices).toEqual([
      'eslint --fix: nothing to fix',
      'stylelint --fix could not run; run it yourself once dependencies are installed',
    ]);
  });

  it('does not run stylelint at all when there is no binary for it', async () => {
    await plantEslint('console.log("[]");\nprocess.exit(0);\n');

    const notices: string[] = [];

    runFixPass(cwd, DEFAULT_ANSWERS, (message) => {
      notices.push(message);
    });

    expect(notices).toEqual(['eslint --fix: nothing to fix']);
  });
});
