import { expect, test } from 'claude-code/testing';

import { shellCommands } from './shellUtils.ts';

test('splits a line into simple commands, dropping redirect targets and comments', () => {
  const commands = shellCommands('cd a && git log > out.txt 2>&1; echo "x\\"y" \'z\' | tail # note\nls');

  expect(commands).toEqual([
    { words: ['cd', 'a'] },
    { words: ['git', 'log'] },
    { words: [
      'echo',
      'x"y',
      'z',
    ] },
    { words: ['tail'] },
    { words: ['ls'] },
  ]);
});

test('feeds a heredoc to its command, and reads a quoted cat heredoc substitution as its text', () => {
  const fed = shellCommands('git commit -F - <<-EOF\nfix: a\n\tEOF\necho done');
  const substituted = shellCommands('git commit -m "$(cat <<\'EOF\'\nfix: b\nEOF\n)"');

  expect(fed).toEqual([{ words: [
    'git',
    'commit',
    '-F',
    '-',
  ], stdin: 'fix: a' }, { words: ['echo', 'done'] }]);

  expect(substituted).toEqual([{ words: [
    'git',
    'commit',
    '-m',
    'fix: b',
  ] }]);
});

test('reads nothing from a line built at run time or left open', () => {
  const lines = [
    'echo $HOME',
    'echo "$(date)"',
    'echo `date`',
    'echo "open',
    'echo \'open',
    'cat <<EOF\nno end',
  ];
  const read = lines.map(shellCommands);

  expect(read).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
});
