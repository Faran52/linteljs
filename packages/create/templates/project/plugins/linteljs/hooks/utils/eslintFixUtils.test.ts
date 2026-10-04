import {
  describe,
  expect,
  it,
} from 'vitest';

import { eslintFixReason } from './eslintFixUtils.ts';

interface CommandProbe {
  command: string;
  label: string;
}

const UNFIXED = /^eslint was called without --fix/u;
const UNREADABLE = /^This command could not be read/u;

const WARNED: CommandProbe[] = [
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

const UNREADABLE_COMMANDS: CommandProbe[] = [
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

const CLEARED: CommandProbe[] = [
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

// Each runner's own option walk, one row per way out of it.
const RUNNERS_WARNED: [string, RegExp][] = [
  ['npx -p', UNREADABLE],
  ['pnpm --filter', UNREADABLE],
  ['pnpm exec --package', UNREADABLE],
  ['npm --prefix', UNREADABLE],
  ['npm exec --package', UNREADABLE],
  ['npm exec eslint src', UNFIXED],
  ['bun x eslint src', UNFIXED],
  ['yarn --cwd app eslint src', UNFIXED],
];

const RUNNERS_CLEARED = [
  'npx',
  'npx prettier src',
  'pnpm',
  'pnpm exec prettier src',
  'npm',
  'npm install',
  'npm exec',
  'npm exec eslint src --fix',
  'bun --cwd app run lint',
];

describe('eslintFixReason', () => {
  it.each(RUNNERS_WARNED)('warns for the runner line %s', (command, expected) => {
    const reply = eslintFixReason(command, 'bash');
    expect(reply).toMatch(expected);
  });

  it.each(RUNNERS_CLEARED)('clears the runner line %s', (command) => {
    const reply = eslintFixReason(command, 'bash');
    expect(reply).toBeUndefined();
  });

  it.each(WARNED)('warns for genuine eslint: $label', ({ command }) => {
    const reply = eslintFixReason(command, 'bash');
    expect(reply).toMatch(UNFIXED);
  });

  it.each(UNREADABLE_COMMANDS)('cannot read $label, and warns', ({ command }) => {
    const reply = eslintFixReason(command, 'bash');
    expect(reply).toMatch(UNREADABLE);
  });

  it.each(CLEARED)('clears a fixed or unrelated command: $label', ({ command }) => {
    const reply = eslintFixReason(command, 'bash');
    expect(reply).toBeUndefined();
  });

  it.each([
    ['eslint src', UNFIXED],
    ['& .\\node_modules\\.bin\\eslint.cmd src', UNFIXED],
    ['npx eslint src; Write-Output done', UNFIXED],
    ['eslint src "unterminated', UNREADABLE],
  ])('reads PowerShell %s', (command, expected) => {
    const reply = eslintFixReason(command, 'powershell');
    expect(reply).toMatch(expected);
  });

  it.each(['eslint src --fix', "pnpm exec eslint --fix 'src'"])('clears PowerShell %s', (command) => {
    const reply = eslintFixReason(command, 'powershell');
    expect(reply).toBeUndefined();
  });

  it.each<'bash' | 'powershell'>(['bash', 'powershell'])('reads Command Prompt reached from %s', (tool) => {
    const cmdReply = eslintFixReason('cmd /c eslint .', tool);
    expect(cmdReply).toMatch(UNFIXED);
    const cmdExeReply = eslintFixReason('cmd.exe /k "npx eslint ."', tool);
    expect(cmdExeReply).toMatch(UNFIXED);
    const unclosedQuoteReply = eslintFixReason('cmd /c "eslint src', tool);
    expect(unclosedQuoteReply).toMatch(UNREADABLE);
    const fixingReply = eslintFixReason('cmd /c "eslint --fix ."', tool);
    expect(fixingReply).toBeUndefined();
  });
});
