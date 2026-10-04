import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { bannedPatternReason } from './bannedPatternUtils.ts';

import type { EditInput } from './hostUtils.ts';

const isPath = (value: unknown): value is string => {
  return typeof value === 'string';
};

describe('bannedPatternReason', () => {
  let checkerLog: string;
  let cwd: string;

  beforeEach(() => {
    const prefix = join(tmpdir(), 'linteljs-hook-assets-');
    cwd = mkdtempSync(prefix);
    checkerLog = join(cwd, 'checker.log');
    mkdirSync(join(cwd, 'scripts'));
    mkdirSync(join(cwd, 'src'));

    const checker = [
      "const fs = require('node:fs');",
      `const log = ${JSON.stringify(checkerLog)};`,
      'const file = process.argv[2];',
      'fs.appendFileSync(log, `${JSON.stringify(file)}\\n`);',
      "const text = fs.readFileSync(file, 'utf8');",
      "const output = text.includes('escape')",
      "  ? 'bad \"cast\"\\nline\\\\slash\\tend'",
      "  : 'bad cast';",
      "if (text.includes('fail')) { process.stderr.write(`${output}\\n`); process.exitCode = 1; }",
      '',
    ].join('\n');
    writeFileSync(join(cwd, 'scripts/checkBannedPatterns.ts'), checker);

    writeFileSync(join(cwd, 'src/app.ts'), 'fail\n');
    writeFileSync(join(cwd, 'src/app.md'), '# safe\n');
  });

  afterEach(() => {
    rmSync(cwd, {
      recursive: true,
      force: true,
    });
  });

  const checkedPaths = (): string[] => {
    if (!existsSync(checkerLog)) {
      return [];
    }

    return readFileSync(checkerLog, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parsed: unknown = JSON.parse(line);

        return isPath(parsed) ? parsed : `not a path: ${line}`;
      });
  };

  const edit = (paths: string[], from: string = cwd): EditInput => {
    const input: EditInput = {
      host: 'claude',
      cwd: from,
      paths,
    };

    return input;
  };

  it('checks a path relative to the cwd, and tells the agent what to do', () => {
    const reason = bannedPatternReason(edit(['src/app.ts']), undefined);

    expect(reason).toBe(`${join(cwd, 'src/app.ts')} now holds a banned pattern, so the edit was blocked. Build `
      + 'the real type instead of casting or suppressing, then write the file again.\nbad cast');
  });

  it('clears a file the checker passes, and checks each path once', () => {
    writeFileSync(join(cwd, 'src/safe.ts'), 'safe\n');

    const reason = bannedPatternReason(edit(['src/safe.ts', './src/safe.ts']), undefined);

    expect(reason).toBeUndefined();
    const actual = checkedPaths();
    const expected = [join(cwd, 'src/safe.ts')];
    expect(actual).toEqual(expected);
  });

  describe.each([
    ['the host names the project root', true],
    ['the host names nothing, so it is found by walking up', false],
  ])('an agent working from a subdirectory, when %s', (_case, hosted) => {
    it('checks the file against the root checker rather than blocking on a missing one', () => {
      mkdirSync(join(cwd, 'dist'));

      const input = edit(['../src/app.ts'], join(cwd, 'dist'));
      const reason = bannedPatternReason(input, hosted ? cwd : undefined);

      expect(reason).toContain('bad cast');
      const actual = checkedPaths();
      const expected = [join(cwd, 'src/app.ts')];
      expect(actual).toEqual(expected);
    });
  });

  it('reads an empty project directory as none', () => {
    const reason = bannedPatternReason(edit(['src/app.ts']), '');
    expect(reason).toContain('bad cast');
  });

  it('finds the checker under the project directory when the cwd is outside the project', () => {
    const prefix = join(tmpdir(), 'linteljs-hook-outside-');
    const outside = mkdtempSync(prefix);
    const file = join(cwd, 'src/app.ts');

    const reason = bannedPatternReason(edit([file], outside), cwd);
    rmSync(outside, { recursive: true });

    expect(reason).toContain('bad cast');
  });

  it('falls back to the cwd when the project directory holds no checker', () => {
    const prefix = join(tmpdir(), 'linteljs-hook-elsewhere-');
    const elsewhere = mkdtempSync(prefix);

    const reason = bannedPatternReason(edit(['src/app.ts']), elsewhere);
    rmSync(elsewhere, { recursive: true });

    expect(reason).toContain('bad cast');
  });

  it('stays silent when no checker exists above the file at all', () => {
    rmSync(join(cwd, 'scripts/checkBannedPatterns.ts'));

    const reason = bannedPatternReason(edit(['src/app.ts']), undefined);
    expect(reason).toBeUndefined();
  });

  it('passes metacharacter, space, and newline paths without shell evaluation', () => {
    const relative = 'src/space ; $(touch injected)\nname.ts';
    const absolute = join(cwd, relative);
    writeFileSync(absolute, 'fail\n');

    const reason = bannedPatternReason(edit([relative]), undefined);

    expect(reason).toContain('now holds a banned pattern');
    const actual = checkedPaths();
    const expected = [absolute];
    expect(actual).toEqual(expected);
    const exists = existsSync(join(cwd, 'injected'));
    expect(exists).toBe(false);
  });

  it('keeps multiline checker output as it is', () => {
    writeFileSync(join(cwd, 'src/escape.ts'), 'fail escape\n');

    const reason = bannedPatternReason(edit(['src/escape.ts']), undefined);

    expect(reason).toMatch(/\nbad "cast"\nline\\slash\tend$/u);
  });

  it('ignores missing files and irrelevant extensions', () => {
    writeFileSync(join(cwd, 'src/app.ts.md'), 'fail\n');

    const reason = bannedPatternReason(edit([
      'src/missing.ts',
      'src/app.md',
      'src/app.ts.md',
    ]), undefined);

    expect(reason).toBeUndefined();
    const actual = checkedPaths();
    expect(actual).toEqual([]);
  });
});
