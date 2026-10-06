import { answersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Agent,
  type Answers,
  type Artifact,
  type Data,
  type Library,
  type Router,
  type Styling,
  type TargetId,
  type Testing,
  type TypeSafety,
} from '@config/types';

import { keysOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import {
  forAnswers,
  linteljsPluginEmitter,
  referenceArtifacts,
} from './linteljsPluginEmitter';

interface AnswerOverrides {
  agents?: Agent[];
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  typeSafety?: TypeSafety;
  styling?: Styling;
  data?: Data;
  router?: Router;
}

interface SkillDocument {
  frontmatter: Map<string, string>;
  body: string;
}

const TARGET_IDS = keysOf(ANSWERS.target.values);
const AGENTS = keysOf(ANSWERS.agents.values);

const find = (overrides: AnswerOverrides, target: string): Artifact | undefined => {
  const artifacts = referenceArtifacts(answersFor(overrides));

  return artifacts
    .find((artifact) => {
      return artifact.target === target;
    });
};

const sourcesOf = (artifact: Artifact | undefined): string[] => {
  return artifact !== undefined && 'sources' in artifact.content ? artifact.content.sources : [];
};

const reference = (name: string): string => {
  return `plugins/linteljs/skills/linteljs/references/${name}`;
};

describe('referenceArtifacts', () => {
  it('names the repo structure source after the target', () => {
    const artifact = find({ target: 'svelte' }, reference('repo-structure.md'));

    const sources = sourcesOf(artifact);
    const expected = [
      'fragments/claude-rules/repo-structure.svelte.md',
      'fragments/claude-rules/repo-structure.standard.md',
    ];
    expect(sources).toEqual(expected);
  });

  it('removes Claude path frontmatter from every emitted reference', async () => {
    const artifacts = referenceArtifacts({
      ...DEFAULT_ANSWERS,
      target: 'react',
      libraries: ['zod'],
    });
    const reads = artifacts
      .map(async ({ content }) => {
        const text = await shippedAssetsReader(content);
        return text;
      });

    const contents = await Promise.all(reads);

    for (const text of contents) {
      expect(text).toMatch(/^[#*]/u);
    }
  });

  const targetsOf = (overrides: AnswerOverrides): string[] => {
    const artifacts = referenceArtifacts(answersFor(overrides));

    return artifacts
      .map(({ target }) => {
        return target;
      });
  };

  const textOf = async (overrides: AnswerOverrides, name: string): Promise<string> => {
    const artifact = find(overrides, reference(name));

    return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
  };

  it.each<[TargetId, string]>([
    ['solid', 'solid-reactivity.md'],
    ['vue', 'vue-reactivity.md'],
    ['svelte', 'svelte-reactivity.md'],
  ])('gives %s its own reactivity rule and no react-state', (target, rule) => {
    const artifact = find({ target }, reference(rule));
    const sources = sourcesOf(artifact);
    const expected = [`fragments/claude-rules/${rule}`];
    expect(sources).toEqual(expected);
    const targets = targetsOf({ target });
    expect(targets).not.toContain(reference('react-state.md'));
  });

  it('emits the zod rule only with zod', () => {
    const targets = targetsOf({ libraries: [] });
    expect(targets).not.toContain(reference('type-standards-zod.md'));

    const artifact = find({ libraries: ['zod'] }, reference('type-standards-zod.md'));
    const sources = sourcesOf(artifact);
    const expected = ['fragments/claude-rules/type-standards-zod.md'];

    expect(sources)
      .toEqual(expected);
  });

  it('drops the testing rule when there is nothing to govern', () => {
    const targets = targetsOf({});
    expect(targets).toContain(reference('testing.md'));
    const untested = targetsOf({ testing: 'none' });
    expect(untested).not.toContain(reference('testing.md'));
  });

  it('composes testing.md from the target head and the shared standard', async () => {
    const testing = await textOf({ target: 'solid' }, 'testing.md');

    expect(testing).toContain('@solidjs/testing-library');
    expect(testing).toContain('## Standard');
    const index = testing.indexOf('## Infrastructure');
    expect(index).toBeLessThan(testing.indexOf('## Standard'));
  });

  it('appends the deviations section to the type rule only when relaxed', async () => {
    const strict = await textOf({}, 'type-standards.md');
    const relaxed = await textOf({ typeSafety: 'relaxed' }, 'type-standards.md');

    expect(strict).not.toContain('## Relaxed type safety');
    expect(relaxed).toContain('## Relaxed type safety');
    expect(relaxed).toContain('## Types');
  });

  it('keeps a gated layout line only for the answer that writes its folder', async () => {
    const plain = await textOf({ target: 'react' }, 'repo-structure.md');
    const routed = await textOf({
      target: 'react',
      router: 'react-router',
    }, 'repo-structure.md');

    expect(plain).not.toContain('routes/router.tsx');
    expect(routed).toContain('\n  routes/router.tsx  the react-router route table\n');
    expect(routed).not.toContain('<!-- when');
  });

  it.each<[string, Partial<Answers>]>([
    ['store', { store: 'zustand' }],
    ['no-store', {}],
    ['popup', {}],
    ['background', {}],
    ['devtools-panel', { surfaces: ['devtools-panel'] }],
    ['msw', { mocking: 'msw' }],
    ['tanstack-query', { data: 'tanstack-query' }],
    ['rtk-query', { data: 'rtk-query' }],
    ['tanstack-router', { router: 'tanstack-router' }],
    ['react-router', { router: 'react-router' }],
    ['react-router-framework', { router: 'react-router-framework' }],
  ])('reads the %s condition off the answers', (condition, answers) => {
    const source = `kept\ngated <!-- when ${condition} -->`;

    const actual = forAnswers(answersFor(answers), source);
    expect(actual).toBe('kept\ngated');
    const opposite = answers.store === undefined ? answersFor({ store: 'zustand' }) : answersFor();

    const ungated = forAnswers({
      ...opposite,
      surfaces: [],
    }, source);
    expect(ungated).toBe('kept');
  });

  it('treats a marker mid-line as text', () => {
    const line = 'a <!-- when msw --> and more';

    const actual = forAnswers(answersFor(), line);
    expect(actual).toBe(line);
  });

  it('refuses a condition no answer decides', () => {
    expect(() => {
      return forAnswers(DEFAULT_ANSWERS, 'line <!-- when tailwind -->');
    }).toThrow('Unknown rule condition: tailwind');
  });

  it.each(TARGET_IDS)('leaves no condition marker in the %s structure rule', async (target) => {
    const text = await textOf({ target }, 'repo-structure.md');
    expect(text).not.toContain('<!--');
  });
});

const targetsOf = (answers: Answers): string[] => {
  return linteljsPluginEmitter(answers)
    .map(({ target }) => {
      return target;
    });
};

describe('linteljsPluginEmitter', () => {
  it.each(AGENTS)('writes the same tree for %s as for no agent at all', (agent) => {
    const targets = targetsOf(answersFor({ agents: [agent] }));
    const agentless = targetsOf(answersFor({ agents: [] }));
    expect(targets).toEqual(agentless);
  });

  it('ships the hooks and the parser and host adapter they share', () => {
    const hooks = linteljsPluginEmitter(DEFAULT_ANSWERS)
      .filter(({ target }) => {
        return target.startsWith('plugins/linteljs/hooks/');
      })
      .map(({ target, executable }) => {
        const hook = [target, executable];
        return hook;
      });

    const expected = [
      ['plugins/linteljs/hooks/gitSafetyGuardHook.ts', undefined],
      ['plugins/linteljs/hooks/eslintFixWarningHook.ts', undefined],
      ['plugins/linteljs/hooks/bannedPatternGuardHook.ts', undefined],
      ['plugins/linteljs/hooks/commitGateHook.ts', undefined],
      ['plugins/linteljs/hooks/checkRecordHook.ts', undefined],
      ['plugins/linteljs/hooks/checkStatus.ts', undefined],
      ['plugins/linteljs/hooks/generatedFileGuardHook.ts', undefined],
      ['plugins/linteljs/hooks/dependencyAskHook.ts', undefined],
      ['plugins/linteljs/hooks/contextWarningHook.ts', undefined],
      ['plugins/linteljs/hooks/mainStatusLine.ts', undefined],
      ['plugins/linteljs/hooks/subagentStatusLine.ts', undefined],
      ['plugins/linteljs/hooks/constants.ts', undefined],
      ['plugins/linteljs/hooks/utils/bannedPatternUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/checkGateUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/commandParserUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/contextUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/dependencyUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/eslintFixUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/generatedFileUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/gitSafetyUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/hostUtils.ts', undefined],
    ];
    expect(hooks).toEqual(expected);
  });
});

const parseSkill = (text: string): SkillDocument => {
  const match = /^---\n([\s\S]+?)\n---\n\n([\s\S]+)$/u.exec(text);

  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error('SKILL.md must contain closed YAML frontmatter and a body');
  }

  const entries = match[1]
    .split('\n')
    .map((line): [string, string] => {
      const separator = line.indexOf(': ');

      if (separator === -1) {
        throw new Error(`Invalid SKILL.md frontmatter line: ${line}`);
      }

      const key = line.slice(0, separator);
      const value = line.slice(separator + 2);
      const entry: [string, string] = [key, value];
      return entry;
    });

  const document: SkillDocument = {
    frontmatter: new Map(entries),
    body: match[2],
  };
  return document;
};

const skillDocument = async (): Promise<SkillDocument> => {
  const [skill] = linteljsPluginEmitter(DEFAULT_ANSWERS);

  const skillText = skill === undefined ? '' : await shippedAssetsReader(skill.content);
  return parseSkill(skillText);
};

describe('SKILL.md', () => {
  it('has the exact required frontmatter', async () => {
    const { frontmatter } = await skillDocument();
    const description = "This project's LintelJS rules for file placement, types, framework state and tests. "
      + 'Use before adding, moving, renaming or editing any source file, state, test, mock or test setup.';

    const record = Object.fromEntries(frontmatter);
    const expected = {
      name: 'linteljs',
      description,
    };
    expect(record).toEqual(expected);
  });

  it.each([
    ['repository structure', 'Adding, moving, renaming or importing a file: `references/repo-structure.md`.'],
    ['typed source', 'Editing typed source: `references/type-standards.md`'],
    ['Zod schemas and APIs', '`references/type-standards-zod.md` when it exists'],
    ['framework state', 'Changing state: each framework state reference in `references/`.'],
    ['tests', 'Editing tests, mocks or test setup: `references/testing.md`, when it exists.'],
  ])('routes %s work', async (_label, text) => {
    const { body } = await skillDocument();
    expect(body).toContain(text);
  });

  it('points at the adapter rather than repeating it', async () => {
    const { body } = await skillDocument();

    expect(body).toContain('The gate, the git bans and the commit rules are in the project\'s `CLAUDE.md`');
    expect(body).not.toContain('git stash');
  });
});
