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
  type Styling,
  type TargetId,
  type Testing,
  type TypeSafety,
} from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { linteljsPluginEmitter, referenceArtifacts } from './linteljsPluginEmitter';

interface AnswerOverrides {
  agents?: Agent[];
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  typeSafety?: TypeSafety;
  styling?: Styling;
  data?: Data;
}

interface SkillDocument {
  frontmatter: Map<string, string>;
  body: string;
}

const find = (overrides: AnswerOverrides, target: string): Artifact | undefined => {
  return referenceArtifacts(answersFor(overrides))
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

    expect(sourcesOf(artifact)).toEqual(['fragments/claude-rules/repo-structure.svelte.md']);
  });

  it('removes Claude path frontmatter from every emitted reference', async () => {
    const artifacts = referenceArtifacts({
      ...DEFAULT_ANSWERS,
      target: 'react',
      libraries: ['zod'],
    });
    const reads = artifacts
      .map(async ({ content }) => {
        return await shippedAssetsReader(content);
      });

    const contents = await Promise.all(reads);

    // Stripped to nothing: every rule's body opens on its heading or on the italic line that says where it ships.
    for (const text of contents) {
      expect(text).toMatch(/^[#*]/u);
    }
  });

  const targetsOf = (overrides: AnswerOverrides): string[] => {
    return referenceArtifacts(answersFor(overrides))
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
    expect(sourcesOf(find({ target }, reference(rule)))).toEqual([`fragments/claude-rules/${rule}`]);
    expect(targetsOf({ target })).not.toContain(reference('react-state.md'));
  });

  it('emits the zod rule only with zod', () => {
    expect(targetsOf({ libraries: [] })).not.toContain(reference('type-standards-zod.md'));
    expect(sourcesOf(find({ libraries: ['zod'] }, reference('type-standards-zod.md'))))
      .toEqual(['fragments/claude-rules/type-standards-zod.md']);
  });

  it('drops the testing rule when there is nothing to govern', () => {
    expect(targetsOf({})).toContain(reference('testing.md'));
    expect(targetsOf({ testing: 'none' })).not.toContain(reference('testing.md'));
  });

  it('composes testing.md from the target head and the shared standard', async () => {
    const testing = await textOf({ target: 'solid' }, 'testing.md');

    expect(testing).toContain('@solidjs/testing-library');
    expect(testing).toContain('## Standard');
    expect(testing.indexOf('## Infrastructure')).toBeLessThan(testing.indexOf('## Standard'));
  });

  // The standard stays whole under either setting; relaxed adds its deviations after it.
  it('appends the deviations section to the type rule only when relaxed', async () => {
    const strict = await textOf({}, 'type-standards.md');
    const relaxed = await textOf({ typeSafety: 'relaxed' }, 'type-standards.md');

    expect(strict).not.toContain('## Relaxed type safety');
    expect(relaxed).toContain('## Relaxed type safety');
    expect(relaxed).toContain('## Types');
  });
});

const targetsOf = (answers: Answers): string[] => {
  return linteljsPluginEmitter(answers)
    .map(({ target }) => {
      return target;
    });
};

describe('linteljsPluginEmitter', () => {
  // Claude and Codex load the tree as a plugin, and Copilot and Cursor are each handed a copy of its rules and run
  // its hook scripts from their own hooks files.
  it.each(valuesOf(ANSWERS.agents.values))('writes the same tree for %s as for no agent at all', (agent) => {
    expect(targetsOf(answersFor({ agents: [agent] }))).toEqual(targetsOf(answersFor({ agents: [] })));
  });

  // `hooks.json` runs each hook through `node`, so none needs to be executable.
  it('ships the hooks and the parser and host adapter they share', () => {
    const hooks = linteljsPluginEmitter(DEFAULT_ANSWERS)
      .filter(({ target }) => {
        return target.startsWith('plugins/linteljs/hooks/');
      })
      .map(({ target, executable }) => {
        return [target, executable];
      });

    expect(hooks).toEqual([
      ['plugins/linteljs/hooks/hooks.json', undefined],
      ['plugins/linteljs/hooks/gitSafetyGuardHook.ts', undefined],
      ['plugins/linteljs/hooks/eslintFixWarningHook.ts', undefined],
      ['plugins/linteljs/hooks/bannedPatternGuardHook.ts', undefined],
      ['plugins/linteljs/hooks/utils/commandParserUtils.ts', undefined],
      ['plugins/linteljs/hooks/utils/hostUtils.ts', undefined],
    ]);
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

      return [line.slice(0, separator), line.slice(separator + 2)];
    });

  return {
    frontmatter: new Map(entries),
    body: match[2],
  };
};

const skillDocument = async (): Promise<SkillDocument> => {
  const [skill] = linteljsPluginEmitter(DEFAULT_ANSWERS);

  return parseSkill(skill === undefined ? '' : await shippedAssetsReader(skill.content));
};

// The skill every agent is routed to first, so each line an agent has to act on is held here by its text.
describe('SKILL.md', () => {
  it('has the exact required frontmatter', async () => {
    const { frontmatter } = await skillDocument();
    const description = "Apply this project's LintelJS structure, type-safety, testing, "
      + 'and verification standards to every coding task.';

    expect(Object.fromEntries(frontmatter)).toEqual({
      name: 'linteljs',
      description,
    });
  });

  it.each([
    ['repository structure', 'Read `references/repo-structure.md` before adding, moving, or renaming files.'],
    ['typed source', 'Read `references/type-standards.md` before editing typed source.'],
    [
      'Zod schemas and APIs',
      'Also read `references/type-standards-zod.md` when it exists and the work touches schemas or API code.',
    ],
    ['framework state', 'Before changing state, read each emitted framework state reference in `references/`.'],
    ['tests', 'Read `references/testing.md` before editing tests, mocks, or test setup.'],
    [
      'hook guardrail review',
      'Treat hooks as guardrails, not a security sandbox, and review every command before running it.',
    ],
    ['check', 'Run the package-manager `check` command before declaring implementation work complete.'],
    ['lint fix', 'Run the package-manager `lint:fix` command, not lint without fixes.'],
  ])('routes %s work', async (_label, text) => {
    expect((await skillDocument()).body).toContain(text);
  });

  it.each([
    'git stash',
    'git reset',
    '--no-verify',
    '--amend',
    'git add -A',
    'git add .',
  ])('bans %s', async (operation) => {
    expect((await skillDocument()).body).toContain(`\`${operation}\``);
  });

  // With --amend banned, the default has to be set before the first commit; the same line both adapters carry.
  it('states the commit trailer policy directly after the git bans', async () => {
    const trailers = '- Commit messages carry no `Co-Authored-By` or tool-attribution trailers.';
    const { body } = await skillDocument();

    expect(body).toContain(trailers);
    expect(body.indexOf('- Never use `git stash`')).toBeLessThan(body.indexOf(trailers));
  });
});
