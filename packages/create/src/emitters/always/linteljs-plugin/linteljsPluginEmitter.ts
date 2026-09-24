import { type Artifact } from '@config/types';

import {
  type Answers,
  hasLibrary,
  hasTests,
} from '@answers';
import { targetFor } from '@targets';

import { copied } from '../../utils/artifactUtils';

export interface RuleSource {
  // `type-standards.md`, the name every agent's copy is filed under.
  name: string;
  sources: string[];
}

const reference = (name: string): string => {
  return `plugins/linteljs/skills/linteljs/references/${name}`;
};

const withoutClaudePaths = (source: string): string => {
  return source.replace(/^---\npaths:\n(?: {2}- .+\n)+---\n\n/u, '');
};

// The rules one project gets, before any agent decides where to put them or what its frontmatter is called.
export const ruleSources = (answers: Answers): RuleSource[] => {
  const target = targetFor(answers);
  const rules: RuleSource[] = [
    {
      name: 'type-standards.md',
      sources: [
        'fragments/claude-rules/type-standards.md',
        ...(answers.typeSafety === 'relaxed' ? ['fragments/claude-rules/type-standards.relaxed.md'] : []),
      ],
    },
    {
      name: 'repo-structure.md',
      sources: [`fragments/claude-rules/repo-structure.${target.id}.md`],
    },
    ...target.stateRules.map((rule) => {
      return {
        name: rule,
        sources: [`fragments/claude-rules/${rule}`],
      };
    }),
  ];

  if (hasLibrary(answers, 'zod')) {
    rules.push({
      name: 'type-standards-zod.md',
      sources: ['fragments/claude-rules/type-standards-zod.md'],
    });
  }

  if (hasTests(answers)) {
    rules.push({
      name: 'testing.md',
      sources: [
        `fragments/claude-rules/testing.${target.id}.md`,
        'fragments/claude-rules/testing.standard.md',
      ],
    });
  }

  return rules;
};

export const referenceArtifacts = (answers: Answers): Artifact[] => {
  return ruleSources(answers).map(({ name, sources }) => {
    return {
      stage: 'standard',
      target: reference(name),
      content: {
        sources,
        transform: withoutClaudePaths,
      },
    };
  });
};

// The plugin tree every agent reads, written whichever agents were chosen: Claude and Codex load it as a plugin,
// Copilot and Cursor are each given a copy of the rule files under it, and all four run its hook scripts.
export const linteljsPluginEmitter = (answers: Answers): Artifact[] => {
  return [
    copied('plugins/linteljs/skills/linteljs/SKILL.md'),
    ...referenceArtifacts(answers),
    copied('plugins/linteljs/hooks/hooks.json'),
    copied('plugins/linteljs/hooks/gitSafetyGuardHook.ts'),
    copied('plugins/linteljs/hooks/eslintFixWarningHook.ts'),
    copied('plugins/linteljs/hooks/bannedPatternGuardHook.ts'),
    copied('plugins/linteljs/hooks/utils/commandParserUtils.ts'),
    copied('plugins/linteljs/hooks/utils/hostUtils.ts'),
  ];
};
