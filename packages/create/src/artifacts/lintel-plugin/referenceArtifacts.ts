import {
  type Answers,
  hasLibrary,
  hasTests,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { type Artifact } from '../artifact/artifact';

const reference = (name: string): string => {
  return `plugins/linteljs/skills/linteljs/references/${name}`;
};

const withoutClaudePaths = (source: string): string => {
  return source.replace(/^---\npaths:\n(?: {2}- .+\n)+---\n\n/u, '');
};

const copiedReference = (name: string, ...sources: string[]): Artifact => {
  return {
    stage: 'standard',
    target: reference(name),
    content: {
      sources,
      transform: withoutClaudePaths,
    },
  };
};

export const referenceArtifacts = (answers: Answers): Artifact[] => {
  const target = targetFor(answers);
  const references: Artifact[] = [
    copiedReference(
      'type-standards.md',
      'claude-rules/type-standards.md',
      ...(answers.typeSafety === 'relaxed' ? ['claude-rules/type-standards.relaxed.md'] : []),
    ),
    copiedReference('repo-structure.md', `claude-rules/repo-structure.${target.id}.md`),
    ...target.stateRules.map((rule) => {
      return copiedReference(rule, `claude-rules/${rule}`);
    }),
  ];

  if (hasLibrary(answers, 'zod')) {
    references.push(copiedReference(
      'type-standards-zod.md',
      'claude-rules/type-standards-zod.md',
    ));
  }

  if (hasTests(answers)) {
    references.push(copiedReference(
      'testing.md',
      `claude-rules/testing.${target.id}.md`,
      'claude-rules/testing.standard.md',
    ));
  }

  return references;
};
