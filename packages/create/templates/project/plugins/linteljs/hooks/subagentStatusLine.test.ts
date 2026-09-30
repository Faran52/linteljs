import { spawnHook } from '@mocks/runHook';
import { expect, it } from 'vitest';

it('prints one JSON line per subagent row', () => {
  const output = spawnHook('subagentStatusLine.ts', {
    transcript_path: '/missing/main.jsonl',
    tasks: [
      {
        id: 'a1',
        type: 'local_agent',
        label: 'Review',
        tokenCount: 160_000,
      },
      {
        id: 'a2',
        type: 'local_agent',
        label: 'Explore',
        tokenCount: 20_000,
      },
    ],
  });

  expect(output).toBe([
    JSON.stringify({ id: 'a1', content: '\u001B[38;5;167m[CTX 160K]\u001B[0m Review' }),
    JSON.stringify({ id: 'a2', content: '\u001B[38;5;108m[CTX 20K]\u001B[0m Explore' }),
    '',
  ].join('\n'));
});

it('prints nothing for a payload it cannot read', () => {
  const output = spawnHook('subagentStatusLine.ts', '{');

  expect(output).toBe('');
});
