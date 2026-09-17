import {
  type Answers,
  hasLibrary,
  hasTests,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { type Artifact } from '../artifact/artifact';

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
        'claude-rules/type-standards.md',
        ...(answers.typeSafety === 'relaxed' ? ['claude-rules/type-standards.relaxed.md'] : []),
      ],
    },
    {
      name: 'repo-structure.md',
      sources: [`claude-rules/repo-structure.${target.id}.md`],
    },
    ...target.stateRules.map((rule) => {
      return {
        name: rule,
        sources: [`claude-rules/${rule}`],
      };
    }),
  ];

  if (hasLibrary(answers, 'zod')) {
    rules.push({
      name: 'type-standards-zod.md',
      sources: ['claude-rules/type-standards-zod.md'],
    });
  }

  if (hasTests(answers)) {
    rules.push({
      name: 'testing.md',
      sources: [`claude-rules/testing.${target.id}.md`, 'claude-rules/testing.standard.md'],
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
