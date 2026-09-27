import { type Answers, type Artifact } from '@config/types';

import { hasLibrary, hasTests } from '@utils/answerUtils';

import { targetFor } from '@targets';

import { copied } from '../../utils/artifactUtils';

export interface RuleSource {
  name: string;
  sources: string[];
}

const reference = (name: string): string => {
  return `plugins/linteljs/skills/linteljs/references/${name}`;
};

const withoutClaudePaths = (source: string): string => {
  return source.replace(/^---\npaths:\n(?: {2}- .+\n)+---\n\n/u, '');
};

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
    ...target.stateRules
      .map((rule) => {
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
  return ruleSources(answers)
    .map(({ name, sources }) => {
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
