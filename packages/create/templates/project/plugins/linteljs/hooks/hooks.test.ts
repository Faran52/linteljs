import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, it } from 'vitest';

it('registers the one conventionally discovered shared hook set', () => {
  expect(JSON.parse(readFileSync(join(import.meta.dirname, 'hooks.json'), 'utf8'))).toEqual({
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
