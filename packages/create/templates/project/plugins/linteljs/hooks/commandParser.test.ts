import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { bashPayload } from '#mocks/runHook';

interface CommandProbe {
  command: string;
  label: string;
}

type Mode = 'eslint' | 'git';

const shellWrapped = (command: string, depth: number): string => {
  let wrapped = command;

  for (let index = 0; index < depth; index += 1) {
    wrapped = `bash -c ${JSON.stringify(wrapped)}`;
  }

  return wrapped;
};

const PARSER = join(import.meta.dirname, 'commandParser.ts');

// Spawned rather than imported: it reads stdin and runs itself on load, the way both shell hooks call it.
const decide = (mode: Mode, input: object | string): string => {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', PARSER, mode], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
  });

  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');

  return result.stdout;
};

const GIT_DENIED: CommandProbe[] = [
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

const GIT_INDETERMINATE: CommandProbe[] = [
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

const GIT_CLEAR: CommandProbe[] = [
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

const ESLINT_WARNED: CommandProbe[] = [
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
    label: 'shell wrapper',
    command: "bash -c 'eslint src'",
  },
  {
    label: 'exec argv-zero wrapper',
    command: 'exec -a linteljs eslint src',
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

const ESLINT_INDETERMINATE: CommandProbe[] = [
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
];

const ESLINT_CLEAR: CommandProbe[] = [
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

describe('git', () => {
  it.each(GIT_DENIED)('denies $label', ({ command }) => {
    expect(decide('git', bashPayload(command))).toBe('deny');
  });

  // A command the parser cannot read is one it cannot vouch for, and the guard denies it as a ban.
  it.each(GIT_INDETERMINATE)('cannot decide $label', ({ command }) => {
    expect(decide('git', bashPayload(command))).toBe('indeterminate');
  });

  it.each(GIT_CLEAR)('clears $label', ({ command }) => {
    expect(decide('git', bashPayload(command))).toBe('clear');
  });
});

describe('eslint', () => {
  it.each(ESLINT_WARNED)('warns for genuine eslint: $label', ({ command }) => {
    expect(decide('eslint', bashPayload(command))).toBe('warn');
  });

  it.each(ESLINT_INDETERMINATE)('cannot decide $label', ({ command }) => {
    expect(decide('eslint', bashPayload(command))).toBe('indeterminate');
  });

  it.each(ESLINT_CLEAR)('clears a fixed or unrelated command: $label', ({ command }) => {
    expect(decide('eslint', bashPayload(command))).toBe('clear');
  });
});

describe.each<Mode>(['git', 'eslint'])('%s host data', (mode) => {
  it('stays silent on malformed JSON', () => {
    expect(decide(mode, '{')).toBe('silent');
  });

  it('stays silent when the payload carries no command', () => {
    expect(decide(mode, { tool_input: {} })).toBe('silent');
  });
});
