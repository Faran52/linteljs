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

import { isJsonObject } from '#utils/objectUtils';

import { runHook } from '#mocks/runHook';

interface HookOutput {
  decision?: 'block';
  reason?: string;
}

const isHookOutput = (value: unknown): value is HookOutput => {
  return isJsonObject(value)
    && (!('decision' in value) || value.decision === 'block')
    && (!('reason' in value) || typeof value.reason === 'string');
};

const parseHookOutput = (text: string): HookOutput => {
  const parsed: unknown = JSON.parse(text);

  if (!isHookOutput(parsed)) {
    throw new Error(`Not a hook output: ${text}`);
  }

  return parsed;
};

const isPath = (value: unknown): value is string => {
  return typeof value === 'string';
};

describe('banned-pattern-guard.sh', () => {
  let checkerLog: string;
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'linteljs-hook-assets-'));
    checkerLog = join(cwd, 'checker.log');
    mkdirSync(join(cwd, 'scripts'));
    mkdirSync(join(cwd, 'src'));
    writeFileSync(
      join(cwd, 'scripts/checkBannedPatterns.ts'),
      [
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
      ].join('\n'),
    );
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

    return readFileSync(checkerLog, 'utf8').trim().split('\n').filter(Boolean).map((line) => {
      const parsed: unknown = JSON.parse(line);

      return isPath(parsed) ? parsed : `not a path: ${line}`;
    });
  };

  it('ignores malformed JSON', () => {
    expect(runHook('banned-pattern-guard.sh', '{')).toBe('');
  });

  it('checks a Claude Write path relative to the payload cwd', () => {
    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: 'src/app.ts' },
    });

    expect(parseHookOutput(output)).toMatchObject({ decision: 'block' });
    expect(parseHookOutput(output).reason).toContain('bad cast');
  });

  /**
   * The checker lives at the project root and the payload's `cwd` is wherever the agent is standing, which is not the
   * same directory. Resolved from `cwd` alone, an agent working in `dist/` was told `Cannot find module` and had the
   * edit blocked for it: node exits non-zero either way, so a missing checker read exactly like a banned pattern.
   *
   * Both hosts are covered because only one of them answers the question. Claude Code exports the root; Codex does
   * not, and there the walk up from `cwd` is the only thing that finds it.
   */
  describe.each([
    ['the host names the project root', true],
    ['the host names nothing, so it is found by walking up', false],
  ])('an agent working from a subdirectory, when %s', (_case, hosted) => {
    it('checks the file against the root checker rather than blocking on a missing one', () => {
      mkdirSync(join(cwd, 'dist'));

      const output = runHook('banned-pattern-guard.sh', {
        cwd: join(cwd, 'dist'),
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: { file_path: '../src/app.ts' },
      }, hosted ? cwd : undefined);

      expect(parseHookOutput(output).reason).toContain('bad cast');
      expect(parseHookOutput(output).reason).not.toContain('Cannot find module');
      expect(checkedPaths()).toEqual([join(cwd, 'src/app.ts')]);
    });
  });

  // A project with no checker has no floor to enforce, which is not the same as a violation to report.
  it('stays silent when no checker exists above the file at all', () => {
    rmSync(join(cwd, 'scripts/checkBannedPatterns.ts'));

    expect(runHook('banned-pattern-guard.sh', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      tool_input: { file_path: 'src/app.ts' },
    })).toBe('');
  });

  it('checks a direct tool response path relative to the payload cwd', () => {
    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'Edit',
      tool_response: { filePath: 'src/app.ts' },
    });

    expect(parseHookOutput(output).reason).toContain('bad cast');
  });

  it('extracts every Add and Update file from the documented Codex apply_patch payload', () => {
    writeFileSync(join(cwd, 'src/first.ts'), 'safe\n');
    writeFileSync(join(cwd, 'src/second.ts'), 'fail\n');
    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'apply_patch',
      tool_input: {
        command: '*** Begin Patch\n*** Update File: src/first.ts\n*** Add File: src/second.ts\n*** End Patch',
      },
    });

    expect(parseHookOutput(output).reason).toContain('bad cast');
    expect(checkedPaths()).toEqual([
      join(cwd, 'src/first.ts'),
      join(cwd, 'src/second.ts'),
    ]);
  });

  it('keeps compatibility with nested Codex apply_patch text', () => {
    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'apply_patch',
      tool_input: {
        patch: '*** Begin Patch\n*** Add File: src/app.ts\n*** End Patch',
      },
    });

    expect(parseHookOutput(output).reason).toContain('bad cast');
  });

  it('keeps compatibility with raw Codex apply_patch text', () => {
    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      hook_event_name: 'PostToolUse',
      tool_name: 'apply_patch',
      tool_input: '*** Begin Patch\n*** Update File: src/app.ts\n*** End Patch',
    });

    expect(parseHookOutput(output).reason).toContain('bad cast');
  });

  it('passes metacharacter, space, and newline paths without shell evaluation', () => {
    const relative = 'src/space ; $(touch injected)\nname.ts';
    const absolute = join(cwd, relative);
    writeFileSync(absolute, 'fail\n');

    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      tool_input: { file_path: relative },
    });

    expect(parseHookOutput(output).decision).toBe('block');
    expect(checkedPaths()).toEqual([absolute]);
    expect(existsSync(join(cwd, 'injected'))).toBe(false);
  });

  it('JSON-escapes multiline checker output', () => {
    writeFileSync(join(cwd, 'src/escape.ts'), 'fail escape\n');

    const output = runHook('banned-pattern-guard.sh', {
      cwd,
      tool_input: { file_path: 'src/escape.ts' },
    });

    expect(parseHookOutput(output).reason)
      .toBe('Banned pattern.\nbad "cast"\nline\\slash\tend');
  });

  it('ignores missing files and patches touching irrelevant extensions', () => {
    expect(runHook('banned-pattern-guard.sh', {
      cwd,
      tool_input: { file_path: 'src/missing.ts' },
    })).toBe('');
    expect(runHook('banned-pattern-guard.sh', {
      cwd,
      tool_input: '*** Update File: src/app.md',
    })).toBe('');
    expect(checkedPaths()).toEqual([]);
  });
});
