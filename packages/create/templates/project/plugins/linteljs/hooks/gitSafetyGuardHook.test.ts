import { commandPayload, runHook } from '@mocks/runHook';
import {
  describe,
  expect,
  it,
} from 'vitest';

interface CommandProbe {
  command: string;
  label: string;
}

const shellWrapped = (command: string, depth: number): string => {
  let wrapped = command;

  for (let index = 0; index < depth; index += 1) {
    wrapped = `bash -c ${JSON.stringify(wrapped)}`;
  }

  return wrapped;
};

const BLOCKED = /^Blocked `/u;
const UNREADABLE = /^The git safety guard could not read this command/u;

const DENIED: CommandProbe[] = [
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
    command: 'exec -a linteljs git reset --hard HEAD',
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
];

// A command the parser cannot read is one it cannot vouch for, and the guard denies it as a ban.
const UNREADABLE_COMMANDS: CommandProbe[] = [
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
    label: 'tokenizer failure',
    command: 'echo "unterminated',
  },
  {
    label: 'recursion depth exhaustion',
    command: shellWrapped('echo safe', 20),
  },
];

const CLEARED: CommandProbe[] = [
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

const POWERSHELL_DENIED: CommandProbe[] = [
  {
    label: 'direct stash',
    command: 'git stash',
  },
  {
    label: 'executable with its extension',
    command: 'git.exe stash',
  },
  {
    label: 'uppercase spelling',
    command: 'GIT STASH',
  },
  {
    label: 'call operator',
    command: '& git stash',
  },
  {
    label: 'call operator on a quoted name',
    command: "& 'git' reset --hard HEAD",
  },
  {
    label: 'call operator on a Windows path',
    command: '& "C:\\Program Files\\Git\\cmd\\git.exe" add -A',
  },
  {
    label: 'backtick line continuation',
    command: 'git add `\r\n-A',
  },
  {
    label: 'push --no-verify',
    command: 'git push --no-verify',
  },
  {
    label: 'semicolon-separated add dot',
    command: 'Get-ChildItem; git add .',
  },
  {
    label: 'and-separated amend',
    command: 'git status && git commit --amend',
  },
  {
    label: 'script block',
    command: 'Invoke-Command { git stash }',
  },
  {
    label: 'subexpression',
    command: 'Write-Output $(git stash)',
  },
  {
    label: 'Invoke-Expression',
    command: 'Invoke-Expression "git stash"',
  },
  {
    label: 'iex alias',
    command: "iex 'git reset --hard HEAD'",
  },
  {
    label: 'pwsh -Command',
    command: 'pwsh -NoProfile -ExecutionPolicy Bypass -Command "git stash"',
  },
  {
    label: 'powershell -c',
    command: 'powershell -c git add -A',
  },
  {
    label: 'cmd /c',
    command: 'cmd /c "git stash"',
  },
];

const POWERSHELL_UNREADABLE: CommandProbe[] = [
  {
    label: 'a computed git argument',
    command: 'git (Write-Output stash)',
  },
  {
    label: 'Start-Process with an argument list',
    command: 'Start-Process git -ArgumentList stash',
  },
  {
    label: 'a subexpression inside double quotes',
    command: 'git commit -m "$(Get-Date)"',
  },
  {
    label: 'an encoded command',
    command: 'pwsh -EncodedCommand ZwBpAHQAIABzAHQAYQBzAGgA',
  },
  {
    label: 'an unterminated quote',
    command: "git status 'unterminated",
  },
  {
    label: 'a block comment',
    command: 'git status <# note #>',
  },
  {
    label: 'a trailing backtick',
    command: 'git status `',
  },
  {
    label: 'an unbalanced brace',
    command: 'Get-Item x }',
  },
];

const POWERSHELL_CLEARED: CommandProbe[] = [
  {
    label: 'status',
    command: 'git status',
  },
  {
    label: 'parentheses inside double quotes',
    command: 'git log --format="%h (%s)"',
  },
  {
    label: 'a script block that runs no git',
    command: "Get-ChildItem | Where-Object { $_.Name -like '*.ts' }",
  },
  {
    label: 'git text passed to Write-Output',
    command: 'Write-Output "git stash"',
  },
  {
    label: 'a doubled single quote',
    command: "git commit -m 'it''s done'",
  },
  {
    label: 'a backslash path, which PowerShell does not escape',
    command: 'git add C:\\repo\\src\\app.ts',
  },
  {
    label: 'Start-Process on another program',
    command: 'Start-Process notepad',
  },
];

describe('gitSafetyGuardHook.ts', () => {
  it.each(DENIED)('denies $label', ({ command }) => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload(command))).toMatch(BLOCKED);
  });

  it.each(UNREADABLE_COMMANDS)('cannot read $label, and denies it', ({ command }) => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload(command))).toMatch(UNREADABLE);
  });

  it.each(CLEARED)('clears $label', ({ command }) => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload(command))).toBeUndefined();
  });

  it.each(POWERSHELL_DENIED)('denies PowerShell $label', ({ command }) => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload(command, 'PowerShell'))).toMatch(BLOCKED);
  });

  it.each(POWERSHELL_UNREADABLE)('cannot read PowerShell with $label, and denies it', ({ command }) => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload(command, 'PowerShell'))).toMatch(UNREADABLE);
  });

  it.each(POWERSHELL_CLEARED)('clears PowerShell $label', ({ command }) => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload(command, 'PowerShell'))).toBeUndefined();
  });

  it('reaches PowerShell from bash through pwsh -c', () => {
    expect(runHook('gitSafetyGuardHook.ts', commandPayload("pwsh -c 'git stash'"))).toMatch(BLOCKED);
  });

  // Neither host has a Command Prompt tool, but both shells can start one.
  describe.each<'Bash' | 'PowerShell'>(['Bash', 'PowerShell'])('Command Prompt reached from %s', (tool) => {
    it.each([
      'cmd /c git stash',
      'cmd.exe /c git stash',
      'cmd /k "git add -A"',
      'cmd /s /c "git status & git reset --hard HEAD"',
    ])('denies %s', (command) => {
      expect(runHook('gitSafetyGuardHook.ts', commandPayload(command, tool))).toMatch(BLOCKED);
    });

    it('cannot read an unterminated quote, and denies it', () => {
      expect(runHook('gitSafetyGuardHook.ts', commandPayload('cmd /c "git status', tool))).toMatch(UNREADABLE);
    });

    it.each(['cmd /c git status', 'cmd', 'cmd /c "echo git stash"'])('clears %s', (command) => {
      expect(runHook('gitSafetyGuardHook.ts', commandPayload(command, tool))).toBeUndefined();
    });
  });

  // Each reason names the command it stopped and what to run instead.
  it.each([
    ['git stash', '`git worktree add`'],
    ['git reset --hard HEAD', '`git restore --staged <path>`'],
    ['git commit --no-verify', 'without it'],
    ['git commit --amend', 'Make a new commit instead'],
    ['git add -A', '`git add <path>...`'],
  ])('tells the agent what to do instead of %s', (command, advice) => {
    const reason = runHook('gitSafetyGuardHook.ts', commandPayload(command));

    expect(reason).toContain(`Blocked \`${command}\``);
    expect(reason).toContain(advice);
  });

  it('stays silent on malformed JSON', () => {
    expect(runHook('gitSafetyGuardHook.ts', '{')).toBeUndefined();
  });

  it('stays silent when the payload carries no command', () => {
    expect(runHook('gitSafetyGuardHook.ts', { tool_input: {} })).toBeUndefined();
  });
});
