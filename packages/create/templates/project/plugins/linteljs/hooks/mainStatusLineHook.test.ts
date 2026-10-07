import { spawnHook } from '@mocks/runHook';
import { expect, it } from 'vitest';

it('prints the main session\'s badge with no newline', () => {
  const output = spawnHook('mainStatusLineHook.ts', { context_window: { total_input_tokens: 140_500 } });

  expect(output).toBe('\u001B[38;5;173m[CTX 140K]\u001B[0m');
});

it('prints a zero badge for a payload it cannot read', () => {
  const output = spawnHook('mainStatusLineHook.ts', '{');

  expect(output).toBe('\u001B[38;5;108m[CTX 0K]\u001B[0m');
});
