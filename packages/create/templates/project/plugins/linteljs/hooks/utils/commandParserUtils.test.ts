import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  commandName,
  type Dialect,
  parseCommand,
  skipOptions,
} from './commandParserUtils.ts';

const tokensOf = (source: string, dialect: Dialect = 'bash'): string[][] | undefined => {
  return parseCommand(source, dialect)
    ?.map(({ tokens }) => {
      return tokens;
    });
};

const shellWrapped = (command: string, depth: number): string => {
  let wrapped = command;

  for (let index = 0; index < depth; index += 1) {
    wrapped = `bash -c ${JSON.stringify(wrapped)}`;
  }

  return wrapped;
};

describe('parseCommand', () => {
  it.each([
    [
      'separators',
      'a; b && c || d | e & f\ng',
      [
        ['a'],
        ['b'],
        ['c'],
        ['d'],
        ['e'],
        ['f'],
        ['g'],
      ],
    ],
    [
      'quotes and escapes',
      'git add "src/a b.ts" \'c d\' e\\ f',
      [[
        'git',
        'add',
        'src/a b.ts',
        'c d',
        'e f',
      ]],
    ],
    [
      'a comment',
      'git status # git stash',
      [['git', 'status']],
    ],
    [
      'a line continuation',
      'git add \\\n-A',
      [[
        'git',
        'add',
        '-A',
      ]],
    ],
    [
      'assignments and negation',
      '! A=1 B=2 git status',
      [['git', 'status']],
    ],
    [
      'env, command, exec, nohup, sudo and time',
      'env A=1 command exec nohup sudo -u me time -f x git log',
      [['git', 'log']],
    ],
    [
      'env split strings',
      "env -S 'git log' --oneline",
      [[
        'git',
        'log',
        '--oneline',
      ]],
    ],
    [
      'a nested shell',
      "bash -c 'a; b'",
      [['a'], ['b']],
    ],
    [
      'a shell running a script',
      'bash deploy.sh',
      [],
    ],
    [
      'a command lookup',
      'command -v git',
      [],
    ],
  ])('reads %s', (_label, source, expected) => {
    const tokens = tokensOf(source);
    expect(tokens).toEqual(expected);
  });

  it.each([
    ['an unterminated quote', 'echo "unterminated'],
    ['a trailing escape', 'echo \\'],
    ['env with a missing operand', 'env -P'],
    ['env with an empty split string', 'env --split-string='],
    ['env with an unknown option', 'env -Q /usr/bin git status'],
    ['a shell with no command after -c', 'bash -c'],
    ['shells nested past the depth limit', shellWrapped('echo safe', 20)],
  ])('cannot read %s', (_label, source) => {
    const actual = parseCommand(source, 'bash');
    expect(actual).toBeUndefined();
  });

  it('reads eight nested shells and no more', () => {
    const tokens = tokensOf(shellWrapped('git log', 8));
    const expected = [['git', 'log']];
    expect(tokens).toEqual(expected);
    const actual = parseCommand(shellWrapped('git log', 9), 'bash');
    expect(actual).toBeUndefined();
  });

  it.each([
    [
      'backticks as escapes and backslashes as literal',
      'git add C:\\src\\a` b.ts',
      [[
        'git',
        'add',
        'C:\\src\\a b.ts',
      ]],
    ],
    [
      'a doubled quote',
      "echo 'it''s'",
      [['echo', "it's"]],
    ],
    [
      'the call operator',
      "& 'git' log",
      [['git', 'log']],
    ],
    [
      'a script block as the commands inside it',
      'Invoke-Command { git log; git status }',
      [
        ['git', 'log'],
        ['git', 'status'],
        ['Invoke-Command'],
      ],
    ],
    [
      'a backtick line continuation',
      'git add `\r\n-A',
      [[
        'git',
        'add',
        '-A',
      ]],
    ],
    [
      'pwsh -Command',
      'pwsh -NoProfile -Command git log',
      [['git', 'log']],
    ],
    [
      'cmd /c',
      'cmd /s /c "git log"',
      [['git', 'log']],
    ],
    [
      'Invoke-Expression',
      'Invoke-Expression -Command "git log"',
      [['git', 'log']],
    ],
    [
      'pwsh running a file',
      'pwsh -File build.ps1',
      [],
    ],
  ])('reads PowerShell %s', (_label, source, expected) => {
    const tokens = tokensOf(source, 'powershell');
    expect(tokens).toEqual(expected);
  });

  it('marks a command with a computed part as opaque, and leaves the rest readable', () => {
    const subexpressionParse = parseCommand('git (Write-Output log); git status', 'powershell');
    const expectedSubexpression = [
      {
        tokens: ['Write-Output', 'log'],
        opaque: false,
      },
      {
        tokens: ['git'],
        opaque: true,
      },
      {
        tokens: ['git', 'status'],
        opaque: false,
      },
    ];
    expect(subexpressionParse).toEqual(expectedSubexpression);

    const startProcessParse = parseCommand('Start-Process -FilePath git -ArgumentList log', 'powershell');
    const expectedStartProcess = [{
      tokens: [
        'git',
        '-ArgumentList',
        'log',
      ],
      opaque: true,
    }];
    expect(startProcessParse).toEqual(expectedStartProcess);
  });

  it.each([
    ['a subexpression in double quotes', 'echo "$(git log)"'],
    ['a here-string', "@'\ngit log\n'@"],
    ['a block comment', '<# git log #>'],
    ['an unclosed group', 'Invoke-Command { git log'],
    ['an unopened group', 'git log }'],
    ['an encoded command', 'powershell -ec ZwBpAHQA'],
  ])('cannot read PowerShell with %s', (_label, source) => {
    const actual = parseCommand(source, 'powershell');
    expect(actual).toBeUndefined();
  });
});

describe('commandName', () => {
  it.each([
    ['/usr/bin/git', 'git'],
    ['C:\\Program Files\\Git\\cmd\\git.exe', 'git'],
    ['node_modules/.bin/eslint.cmd', 'eslint'],
    ['GIT', 'git'],
  ])('reads %s as %s', (token, name) => {
    const actual = commandName(token);
    expect(actual).toBe(name);
  });
});

describe('skipOptions', () => {
  it('skips flags and valued options, and stops after --', () => {
    const valuedSkip = skipOptions([
      '-C',
      'dir',
      '--bare',
      'log',
    ], 0, new Set(['-C']));
    expect(valuedSkip).toBe(3);

    const terminatorSkip = skipOptions(['--', '-x'], 0, new Set());
    expect(terminatorSkip).toBe(1);
  });

  it('cannot skip a valued option with no value', () => {
    const actual = skipOptions(['-C'], 0, new Set(['-C']));
    expect(actual).toBeUndefined();
  });
});
