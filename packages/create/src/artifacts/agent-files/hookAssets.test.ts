import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
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

import { ASSETS_ROOT } from '../../run/shipped-assets/shippedAssets';

interface BashHookPayload {
  cwd: string;
  hook_event_name: 'PreToolUse';
  tool_name: 'Bash';
  tool_input: { command: string };
}

interface BashPayloadCase {
  label: string;
  payload: (cwd: string, command: string) => BashHookPayload;
}

interface HookOutput {
  decision?: 'block';
  reason?: string;
}

interface CommandProbe {
  command: string;
  label: string;
}

const HOOK_ASSETS = join(ASSETS_ROOT, 'linteljs-plugin/hooks');
const COMMAND_PARSER = 'commandParser.js';
const HOOK_SCRIPTS = [
  'eslint-fix-warning.sh',
  'git-safety-guard.sh',
  'banned-pattern-guard.sh',
] as const;

const shellWrapped = (command: string, depth: number): string => {
  let wrapped = command;

  for (let index = 0; index < depth; index += 1) {
    wrapped = `bash -c ${JSON.stringify(wrapped)}`;
  }

  return wrapped;
};

const ESLINT_WARNING = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    additionalContext: 'eslint was called without --fix. Run eslint <files> --fix instead.',
  },
};

const GIT_DENIAL = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: 'Banned git operation. Stage only explicit paths and never '
      + 'bypass hooks or rewrite the current commit.',
  },
};

const bashPayload = (cwd: string, command: string): BashHookPayload => {
  return {
    cwd,
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
  };
};

const BASH_PAYLOADS: BashPayloadCase[] = [
  {
    label: 'Claude',
    payload: bashPayload,
  },
  {
    label: 'Codex',
    payload: bashPayload,
  },
];

const BANNED_GIT_COMMANDS: CommandProbe[] = [
  {
    label: 'direct stash',
    command: 'git stash',
  },
  {
    label: 'direct reset',
    command: 'git reset --hard HEAD',
  },
  {
    label: 'commit --no-verify',
    command: 'git commit --no-verify',
  },
  {
    label: 'commit --amend',
    command: 'git commit --amend',
  },
  {
    label: 'add -A',
    command: 'git add -A',
  },
  {
    label: 'add --all',
    command: 'git add --all',
  },
  {
    label: 'add dot',
    command: 'git add .',
  },
  {
    label: 'quoted add dot',
    command: 'git add "."',
  },
  {
    label: 'global -C before stash',
    command: 'git -C . stash',
  },
  {
    label: 'global --no-pager before reset',
    command: 'git --no-pager reset --hard HEAD',
  },
  {
    label: 'add option before -A',
    command: 'git add -v -A',
  },
  {
    label: 'env wrapper',
    command: 'env LINTEL_TEST=1 git commit --amend',
  },
  {
    label: 'env split-string wrapper',
    command: "env -S 'git stash'",
  },
  {
    label: 'env long split-string wrapper',
    command: "env --split-string 'git reset --hard HEAD'",
  },
  {
    label: 'env separate short split with trailing argv',
    command: 'env -S git stash',
  },
  {
    label: 'env attached short split with trailing argv',
    command: 'env -Sgit stash',
  },
  {
    label: 'env separate long split with trailing argv',
    command: 'env --split-string git stash',
  },
  {
    label: 'env attached long split with trailing argv',
    command: 'env --split-string=git reset --hard HEAD',
  },
  {
    label: 'env separate path operand',
    command: 'env -P /usr/bin git stash',
  },
  {
    label: 'env attached path operand',
    command: 'env -P/usr/bin git stash',
  },
  {
    label: 'env missing path operand',
    command: 'env -P',
  },
  {
    label: 'env empty split string',
    command: 'env --split-string=',
  },
  {
    label: 'env unknown long option',
    command: 'env --future-path /usr/bin git status',
  },
  {
    label: 'env unknown short option',
    command: 'env -Q /usr/bin git status',
  },
  {
    label: 'env option operand',
    command: 'env --unset LINTEL_TEST git stash',
  },
  {
    label: 'command wrapper',
    command: 'command git add --all',
  },
  {
    label: 'shell wrapper',
    command: "bash -c 'git -C . stash'",
  },
  {
    label: 'five nested shell wrappers',
    command: shellWrapped('git stash', 5),
  },
  {
    label: 'exec argv-zero wrapper',
    command: 'exec -a lintel git reset --hard HEAD',
  },
  {
    label: 'nohup option terminator',
    command: 'nohup -- git stash',
  },
  {
    label: 'sudo wrapper',
    command: 'sudo -u root git reset --hard HEAD',
  },
  {
    label: 'and-separated invocation',
    command: 'echo safe && git -C . stash',
  },
  {
    label: 'pipe-separated invocation',
    command: 'printf safe | git --no-pager reset --hard HEAD',
  },
  {
    label: 'newline-separated invocation',
    command: 'git status\ngit add -v -A',
  },
  {
    label: 'tokenizer failure',
    command: 'echo "unterminated',
  },
  {
    label: 'recursion depth exhaustion',
    command: shellWrapped('echo safe', 20),
  },
];

const ALLOWED_GIT_COMMANDS: CommandProbe[] = [
  {
    label: 'status',
    command: 'git status',
  },
  {
    label: 'explicit source path',
    command: 'git add src/app.ts',
  },
  {
    label: 'quoted source path',
    command: 'git add "src/app.ts"',
  },
  {
    label: 'unrelated stash text',
    command: 'printf "%s\\n" "legit stash"',
  },
  {
    label: 'unrelated --no-verify argument',
    command: 'node scripts/report.js --no-verify',
  },
  {
    label: 'explicit --amend filename',
    command: 'git add -- --amend',
  },
  {
    label: 'explicit --no-verify filename',
    command: 'git add -- --no-verify',
  },
  {
    label: 'commit path after separator',
    command: 'git commit -- --amend',
  },
  {
    label: 'Git text passed to rg',
    command: 'rg "git stash" docs',
  },
  {
    label: 'command lookup',
    command: 'command -v git && echo stash',
  },
  {
    label: 'unrelated shell wrapper',
    command: "bash -c 'echo legit stash'",
  },
  {
    label: 'env separate short split status',
    command: 'env -S git status',
  },
  {
    label: 'env attached short split status',
    command: 'env -Sgit status',
  },
  {
    label: 'env separate long split status',
    command: 'env --split-string git status',
  },
  {
    label: 'env attached long split status',
    command: 'env --split-string=git status',
  },
  {
    label: 'env separate path status',
    command: 'env -P /usr/bin git status',
  },
  {
    label: 'env attached path status',
    command: 'env -P/usr/bin git status',
  },
];

const ESLINT_WARNING_COMMANDS: CommandProbe[] = [
  {
    label: 'direct executable',
    command: 'eslint src',
  },
  {
    label: 'local executable path',
    command: './node_modules/.bin/eslint src',
  },
  {
    label: 'pnpm target',
    command: 'pnpm eslint src',
  },
  {
    label: 'pnpm exec target',
    command: 'pnpm exec eslint src',
  },
  {
    label: 'npm exec target',
    command: 'npm exec eslint -- src',
  },
  {
    label: 'npx target',
    command: 'npx eslint src',
  },
  {
    label: 'yarn target',
    command: 'yarn eslint src',
  },
  {
    label: 'bunx target',
    command: 'bunx eslint src',
  },
  {
    label: 'environment wrapper',
    command: 'env NODE_ENV=test pnpm exec eslint src',
  },
  {
    label: 'environment split-string wrapper',
    command: "env -S 'eslint src'",
  },
  {
    label: 'environment separate short split with trailing argv',
    command: 'env -S eslint src',
  },
  {
    label: 'environment attached short split with trailing argv',
    command: 'env -Seslint src',
  },
  {
    label: 'environment separate long split with trailing argv',
    command: 'env --split-string eslint src',
  },
  {
    label: 'environment attached long split with trailing argv',
    command: 'env --split-string=eslint src',
  },
  {
    label: 'environment separate path operand',
    command: 'env -P /usr/bin eslint src',
  },
  {
    label: 'environment attached path operand',
    command: 'env -P/usr/bin eslint src',
  },
  {
    label: 'environment missing path operand',
    command: 'env -P',
  },
  {
    label: 'environment empty split string',
    command: 'env --split-string=',
  },
  {
    label: 'environment unknown long option',
    command: 'env --future-path /usr/bin eslint src',
  },
  {
    label: 'environment unknown short option',
    command: 'env -Q /usr/bin eslint src',
  },
  {
    label: 'shell wrapper',
    command: "bash -c 'eslint src'",
  },
  {
    label: 'exec argv-zero wrapper',
    command: 'exec -a lintel eslint src',
  },
  {
    label: '--fix-dry-run only',
    command: 'eslint src --fix-dry-run',
  },
  {
    label: '--fix-type only',
    command: 'eslint src --fix-type problem',
  },
  {
    label: '--fix after option separator',
    command: 'eslint src -- --fix',
  },
  {
    label: 'later segment echoing --fix',
    command: 'pnpm eslint src; echo --fix',
  },
  {
    label: 'operator-separated target',
    command: 'echo safe && eslint src',
  },
];

const ESLINT_ALLOWED_COMMANDS: CommandProbe[] = [
  {
    label: 'direct exact --fix',
    command: 'eslint src --fix',
  },
  {
    label: 'runner exact --fix',
    command: 'pnpm exec eslint --fix src',
  },
  {
    label: 'npm forwarded exact --fix',
    command: 'npm exec eslint -- --fix src',
  },
  {
    label: 'exact --fix with fix type',
    command: 'eslint --fix-type problem --fix src',
  },
  {
    label: 'environment split-string exact --fix',
    command: "env -S 'eslint src --fix'",
  },
  {
    label: 'environment separate short split exact --fix',
    command: 'env -S eslint src --fix',
  },
  {
    label: 'environment attached short split exact --fix',
    command: 'env -Seslint src --fix',
  },
  {
    label: 'environment separate long split exact --fix',
    command: 'env --split-string eslint src --fix',
  },
  {
    label: 'environment attached long split exact --fix',
    command: 'env --split-string=eslint src --fix',
  },
  {
    label: 'environment separate path exact --fix',
    command: 'env -P /usr/bin eslint src --fix',
  },
  {
    label: 'environment attached path exact --fix',
    command: 'env -P/usr/bin eslint src --fix',
  },
  {
    label: 'shell wrapper exact --fix',
    command: "bash -c 'eslint src --fix'",
  },
  {
    label: 'unrelated report script',
    command: 'node scripts/eslint-report.js',
  },
  {
    label: 'unrelated text',
    command: 'echo eslint',
  },
  {
    label: 'unrelated segments',
    command: 'echo eslint; echo --fix',
  },
  {
    label: 'command lookup',
    command: 'command -v eslint',
  },
];

const parseHookOutput = (text: string): HookOutput => {
  return JSON.parse(text) as HookOutput;
};

/**
 * `projectDir` is the host's own answer for where the project root is, and it is dropped unless a case sets one: this
 * suite runs under a harness that exports it, and inheriting it would point every hook at this workspace rather than
 * at the fixture, which resolves because this workspace has a checker of its own.
 */
const runHook = (
  name: typeof HOOK_SCRIPTS[number],
  input: object | string,
  projectDir?: string,
): string => {
  const env: typeof process.env = {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: join(ASSETS_ROOT, 'linteljs-plugin'),
  };

  delete env['CLAUDE_PROJECT_DIR'];

  if (projectDir !== undefined) {
    env['CLAUDE_PROJECT_DIR'] = projectDir;
  }

  const result = spawnSync('/bin/bash', [join(HOOK_ASSETS, name)], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env,
  });

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');

  return result.stdout.trim();
};

describe('portable hook assets', () => {
  let checkerLog: string;
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'lintel-hook-assets-'));
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
      return JSON.parse(line) as string;
    });
  };

  it('registers the one conventionally discovered shared hook set', () => {
    expect(JSON.parse(readFileSync(join(HOOK_ASSETS, 'hooks.json'), 'utf8'))).toEqual({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                type: 'command',
                command: 'bash "${CLAUDE_PLUGIN_ROOT}/hooks/eslint-fix-warning.sh"',
              },
              {
                type: 'command',
                command: 'bash "${CLAUDE_PLUGIN_ROOT}/hooks/git-safety-guard.sh"',
              },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: 'Edit|Write|apply_patch',
            hooks: [
              {
                type: 'command',
                command: 'bash "${CLAUDE_PLUGIN_ROOT}/hooks/banned-pattern-guard.sh"',
              },
            ],
          },
        ],
      },
    });
  });

  it.each(ESLINT_WARNING_COMMANDS)('warns for genuine eslint: $label', ({ command }) => {
    expect(JSON.parse(runHook('eslint-fix-warning.sh', bashPayload(cwd, command))))
      .toEqual(ESLINT_WARNING);
  });

  it.each(ESLINT_ALLOWED_COMMANDS)('does not warn for fixed or unrelated command: $label', ({
    command,
  }) => {
    expect(runHook('eslint-fix-warning.sh', bashPayload(cwd, command))).toBe('');
  });

  describe.each(BASH_PAYLOADS)('$label Bash payload', ({ payload }) => {
    it.each(BANNED_GIT_COMMANDS)('denies $label', ({ command }) => {
      expect(JSON.parse(runHook('git-safety-guard.sh', payload(cwd, command))))
        .toEqual(GIT_DENIAL);
    });

    it.each(ALLOWED_GIT_COMMANDS)('allows $label', ({ command }) => {
      expect(runHook('git-safety-guard.sh', payload(cwd, command))).toBe('');
    });
  });

  it.each(HOOK_SCRIPTS)('ignores malformed JSON in %s', (script) => {
    expect(runHook(script, '{')).toBe('');
  });

  it('keeps missing Bash command host data as a silent allow', () => {
    expect(runHook('git-safety-guard.sh', {
      cwd,
      tool_input: {},
    })).toBe('');
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

  it('ships every hook script with an executable mode', () => {
    for (const script of HOOK_SCRIPTS) {
      expect(statSync(join(HOOK_ASSETS, script)).mode & 0o111).toBe(0o111);
    }
  });

  it('ships the shared parser as a non-executable Node asset', () => {
    expect(statSync(join(HOOK_ASSETS, COMMAND_PARSER)).mode & 0o111).toBe(0);
  });
});
