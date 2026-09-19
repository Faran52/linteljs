import {
  describe,
  expect,
  it,
} from 'vitest';

import { removableTargets } from './removableTargets';

/**
 * The inventory is derived, so this is the golden list held against it: exactly these paths and no others. Sorted
 * on both sides, because the order `sync` reports obsolete files in is not a contract; which files they are is.
 */
const byPath = (left: string, right: string): number => {
  return left.localeCompare(right);
};

const GENERATED_AGENT_TARGETS = [...removableTargets()].toSorted(byPath);

describe('removableTargets', () => {
  it('is the closed removable inventory and excludes project-owned adapters', () => {
    expect(GENERATED_AGENT_TARGETS).toEqual([
      '.agents/plugins/marketplace.json',
      '.claude/settings.json',
      '.npmrc',
      '.yarnrc.yml',
      // What versions through 1.6.0 wrote, cleared by the first sync after an upgrade.
      'lintel.config.json',
      '.cursor/rules/hooks-order.mdc',
      '.cursor/rules/react-state.mdc',
      '.cursor/rules/repo-structure.mdc',
      '.cursor/rules/solid-reactivity.mdc',
      '.cursor/rules/svelte-reactivity.mdc',
      '.cursor/rules/testing.mdc',
      '.cursor/rules/type-standards-zod.mdc',
      '.cursor/rules/type-standards.mdc',
      '.cursor/rules/vue-reactivity.mdc',
      '.github/instructions/hooks-order.instructions.md',
      '.github/instructions/react-state.instructions.md',
      '.github/instructions/repo-structure.instructions.md',
      '.github/instructions/solid-reactivity.instructions.md',
      '.github/instructions/svelte-reactivity.instructions.md',
      '.github/instructions/testing.instructions.md',
      '.github/instructions/type-standards-zod.instructions.md',
      '.github/instructions/type-standards.instructions.md',
      '.github/instructions/vue-reactivity.instructions.md',
      'plugins/linteljs/.claude-plugin/marketplace.json',
      'plugins/linteljs/.claude-plugin/plugin.json',
      'plugins/linteljs/.codex-plugin/plugin.json',
      'plugins/linteljs/hooks/banned-pattern-guard.sh',
      'plugins/linteljs/hooks/commandParser.js',
      'plugins/linteljs/hooks/eslint-fix-warning.sh',
      'plugins/linteljs/hooks/git-safety-guard.sh',
      'plugins/linteljs/hooks/hooks.json',
      'plugins/linteljs/skills/linteljs/SKILL.md',
      'src/typings/customTypes.d.ts',
      'plugins/linteljs/skills/linteljs/references/hooks-order.md',
      'plugins/linteljs/skills/linteljs/references/react-state.md',
      'plugins/linteljs/skills/linteljs/references/repo-structure.md',
      'plugins/linteljs/skills/linteljs/references/solid-reactivity.md',
      'plugins/linteljs/skills/linteljs/references/svelte-reactivity.md',
      'plugins/linteljs/skills/linteljs/references/testing.md',
      'plugins/linteljs/skills/linteljs/references/type-standards-zod.md',
      'plugins/linteljs/skills/linteljs/references/type-standards.md',
      'plugins/linteljs/skills/linteljs/references/vue-reactivity.md',
    ].toSorted(byPath));
    expect(GENERATED_AGENT_TARGETS).not.toEqual(expect.arrayContaining([
      'CLAUDE.md',
      'AGENTS.md',
      '.github/copilot-instructions.md',
      '.cursor/rules/linteljs.mdc',
    ]));
  });
});
