import { existsSync } from 'node:fs';
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execPath } from 'node:process';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { typecheckStaged } from './typecheckStagedUtils.ts';

interface RunResult {
  code: number;
  logged: string;
}

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-typecheck-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  vi.restoreAllMocks();

  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

// A command that prints this text and fails, standing in for tsc.
const failingWith = async (output: string): Promise<string> => {
  const path = join(cwd, 'output.txt');
  await writeFile(path, output, 'utf8');

  const script = "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8')); process.exit(2)";

  return `"${execPath}" -e "${script}" "${path}"`;
};

const run = (staged: string[], command: string): RunResult => {
  const errors = vi.spyOn(console, 'error')
    .mockReturnValue();
  const code = typecheckStaged(staged, command);

  const result: RunResult = {
    code,
    logged: errors.mock.calls
      .flat()
      .join('\n'),
  };

  return result;
};

describe('typecheckStaged', () => {
  it('runs nothing when nothing is staged', () => {
    const sentinel = join(cwd, 'invoked.txt');
    const command = `"${execPath}" -e "require('node:fs').writeFileSync(process.argv[1], '')" "${sentinel}"`;

    const { code } = run([], command);

    expect(code).toBe(0);
    const invoked = existsSync(sentinel);
    expect(invoked).toBe(false);
  });

  it('passes when the typecheck passes', () => {
    const { code } = run(['src/clean.ts'], `"${execPath}" -e ""`);
    expect(code).toBe(0);
  });

  it('reports the errors in a staged file, in either tsc format and through colour codes', async () => {
    const output = [
      'src/broken.ts(1,14): error TS2322: wrong',
      '\u001b[96msrc/broken.ts\u001b[0m:\u001b[93m2\u001b[0m:\u001b[93m3\u001b[0m'
      + ' - \u001b[91merror\u001b[0m\u001b[90m TS2304: \u001b[0mmissing',
      'src/other.ts(1,1): error TS2322: elsewhere',
      'src/broken.ts: a line with no diagnostic',
      '',
    ].join('\n');
    const command = await failingWith(output);

    const { code, logged } = run([String.raw`C:\repo\src\broken.ts`], command);

    expect(code).toBe(1);
    expect(logged).toContain('TypeScript errors in staged files:\nsrc/broken.ts(1,14): error TS2322: wrong');
    expect(logged).toContain('wrong\n\u001b[96msrc/broken.ts');
    expect(logged).not.toContain('elsewhere');
    expect(logged).not.toContain('no diagnostic');
  });

  it('matches a staged path with no src segment as written', async () => {
    const command = await failingWith('lib/tool.ts(1,1): error TS2322: wrong\n');

    const { code } = run(['lib/tool.ts'], command);

    expect(code).toBe(1);
  });

  it('does not match a path with no src segment against any other file', async () => {
    const command = await failingWith('lib/other.ts(1,1): error TS2322: elsewhere\n');

    const { code } = run(['lib/tool.ts'], command);

    expect(code).toBe(0);
  });

  it('reports an error in any one of several staged files', async () => {
    const command = await failingWith('src/a.ts(1,1): error TS2322: wrong\n');

    const { code } = run(['src/a.ts', 'src/b.ts'], command);

    expect(code).toBe(1);
  });

  it('trusts a passing exit status over what the command prints', () => {
    const command = `"${execPath}" -e "console.log('src/a.ts(1,1): error TS2322: wrong')"`;

    const { code } = run(['src/a.ts'], command);

    expect(code).toBe(0);
  });

  it('passes when every error belongs to an unstaged file', async () => {
    const command = await failingWith('src/other.ts(1,1): error TS2322: elsewhere\n');

    const { code, logged } = run(['src/clean.ts'], command);

    expect(code).toBe(0);
    expect(logged).toBe('');
  });
});
