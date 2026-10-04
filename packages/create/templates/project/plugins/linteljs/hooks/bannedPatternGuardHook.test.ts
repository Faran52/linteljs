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

import { copilotPayload, runHook } from '@mocks/runHook';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

const isPath = (value: unknown): value is string => {
  return typeof value === 'string';
};

describe('bannedPatternGuardHook.ts', () => {
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
      "if (text.includes('fail')) { process.stderr.write(output); process.exitCode = 1; }",
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

  it('ignores malformed JSON', () => {
    const reply = runHook('bannedPatternGuardHook.ts', '{');
    expect(reply).toBeUndefined();
  });

  it('checks a Claude Write path relative to the payload cwd', () => {
    const output = runHook('bannedPatternGuardHook.ts', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: 'src/app.ts' },
    });

    expect(output).toContain('bad cast');
  });

  describe.each([
    ['the host names the project root', true],
    ['the host names nothing, so it is found by walking up', false],
  ])('an agent working from a subdirectory, when %s', (_case, hosted) => {
    it('checks the file against the root checker rather than blocking on a missing one', () => {
      mkdirSync(join(cwd, 'dist'));

      const output = runHook('bannedPatternGuardHook.ts', {
        cwd: join(cwd, 'dist'),
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: { file_path: '../src/app.ts' },
      }, hosted ? cwd : undefined);

      expect(output).toContain('bad cast');
      expect(output).not.toContain('Cannot find module');
      const actual = checkedPaths();
      const expected = [join(cwd, 'src/app.ts')];
      expect(actual).toEqual(expected);
    });
  });

  it('extracts every Add and Update file from the documented Codex apply_patch payload', () => {
    writeFileSync(join(cwd, 'src/first.ts'), 'safe\n');
    writeFileSync(join(cwd, 'src/second.ts'), 'fail\n');
    const output = runHook('bannedPatternGuardHook.ts', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'apply_patch',
      tool_input: {
        command: '*** Begin Patch\n*** Update File: src/first.ts\n*** Add File: src/second.ts\n*** End Patch',
      },
    });

    expect(output).toContain('bad cast');

    const actual = checkedPaths();
    const expected = [
      join(cwd, 'src/first.ts'),
      join(cwd, 'src/second.ts'),
    ];
    expect(actual).toEqual(expected);
  });

  it('JSON-escapes multiline checker output', () => {
    writeFileSync(join(cwd, 'src/escape.ts'), 'fail escape\n');

    const output = runHook('bannedPatternGuardHook.ts', {
      cwd,
      tool_input: { file_path: 'src/escape.ts' },
    });

    expect(output).toBe(`${join(cwd, 'src/escape.ts')} now holds a banned pattern, so the edit was blocked. Build `
      + 'the real type instead of casting or suppressing, then write the file again.\nbad "cast"\nline\\slash\tend');
  });

  it.each(['edit', 'create'])('checks the path Copilot\'s %s tool names, and reports it as added context', (tool) => {
    const output = runHook('bannedPatternGuardHook.ts', copilotPayload(tool, { path: 'src/app.ts' }, cwd));

    expect(output).toContain('bad cast');
    const actual = checkedPaths();
    const expected = [join(cwd, 'src/app.ts')];
    expect(actual).toEqual(expected);
  });

  it('answers nothing under Cursor', () => {
    const reply = runHook('bannedPatternGuardHook.ts', {
      cursor_version: '2.4.0',
      cwd,
      hook_event_name: 'postToolUse',
      tool_name: 'Write',
      tool_input: { file_path: 'src/app.ts' },
    });
    expect(reply).toBeUndefined();

    const actual = checkedPaths();
    expect(actual).toEqual([]);
  });
});
