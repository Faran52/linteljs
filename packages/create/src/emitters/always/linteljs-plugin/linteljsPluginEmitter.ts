import {
  type Answers,
  type Artifact,
  type Data,
  type Mocking,
  type Router,
} from '@config/types';

import {
  hasLibrary,
  hasSurface,
  hasTests,
} from '@utils/answerUtils';

import { targetFor } from '@targets';

import { copied } from '../../utils/artifactUtils';

import { withoutClaudePaths } from './utils/frontmatterUtils';

export interface RuleSource {
  name: string;
  sources: string[];
}

type Condition = 'store' | 'no-store' | 'popup' | 'background' | 'devtools-panel' | Mocking | Data | Router;

const reference = (name: string): string => {
  return `plugins/linteljs/skills/linteljs/references/${name}`;
};

// A rule line ending in `<!-- when <condition> -->` names a folder only that answer writes.
const CONDITIONS: Record<Condition, (answers: Answers) => boolean> = {
  'store': (answers) => {
    return answers.store !== undefined;
  },
  'no-store': (answers) => {
    return answers.store === undefined;
  },
  'popup': (answers) => {
    return hasSurface(answers, 'popup');
  },
  'background': (answers) => {
    return hasSurface(answers, 'background');
  },
  'devtools-panel': (answers) => {
    return hasSurface(answers, 'devtools-panel');
  },
  'msw': (answers) => {
    return answers.mocking === 'msw';
  },
  'tanstack-query': (answers) => {
    return answers.data === 'tanstack-query';
  },
  'rtk-query': (answers) => {
    return answers.data === 'rtk-query';
  },
  'tanstack-router': (answers) => {
    return answers.router === 'tanstack-router';
  },
  'react-router': (answers) => {
    return answers.router === 'react-router';
  },
  'react-router-framework': (answers) => {
    return answers.router === 'react-router-framework';
  },
};

const WHEN = / <!-- when ([\w-]+) -->$/u;

const isCondition = (name: string): name is Condition => {
  return Object.hasOwn(CONDITIONS, name);
};

export const forAnswers = (answers: Answers, source: string): string => {
  return source
    .split('\n')
    .flatMap((line) => {
      const name = WHEN.exec(line)?.[1];

      if (name === undefined) {
        return [line];
      }

      if (!isCondition(name)) {
        throw new Error(`Unknown rule condition: ${name}`);
      }

      return CONDITIONS[name](answers)
        ? [line
            .replace(WHEN, '')
            .trimEnd()]
        : [];
    })
    .join('\n');
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
      sources: [
        `fragments/claude-rules/repo-structure.${target.id}.md`,
        'fragments/claude-rules/repo-structure.standard.md',
      ],
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
          transform: (source: string) => {
            return withoutClaudePaths(forAnswers(answers, source));
          },
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
    copied('plugins/linteljs/hooks/contextWarningHook.ts'),
    copied('plugins/linteljs/hooks/mainStatusLine.ts'),
    copied('plugins/linteljs/hooks/subagentStatusLine.ts'),
    copied('plugins/linteljs/hooks/constants.ts'),
    copied('plugins/linteljs/hooks/utils/commandParserUtils.ts'),
    copied('plugins/linteljs/hooks/utils/contextUtils.ts'),
    copied('plugins/linteljs/hooks/utils/hostUtils.ts'),
  ];
};
