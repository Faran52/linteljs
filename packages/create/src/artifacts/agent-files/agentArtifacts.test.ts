import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type Agent,
  type Answers,
  DEFAULT_ANSWERS,
  type Plugin,
  TARGET_IDS,
  type TargetId,
  type Testing,
  TESTING_CHOICES,
} from '../../model/answers/answers';
import { contentOf } from '../../run/shipped-assets/shippedAssets';
import { type Artifact } from '../artifact/artifact';

import { agentArtifacts, GENERATED_AGENT_TARGETS } from './agentArtifacts';

interface HostCase {
  label: string;
  agents: Agent[];
}

interface ArtifactMatrixCase extends HostCase {
  target: TargetId;
  zod: boolean;
  testing: Testing;
}

interface SkillDocument {
  frontmatter: Map<string, string>;
  body: string;
}

interface SkillExpectation {
  label: string;
  text: string;
}

const HOST_CASES: HostCase[] = [
  {
    label: 'Claude',
    agents: ['claude-code'],
  },
  {
    label: 'Codex',
    agents: ['codex'],
  },
  {
    label: 'dual host',
    agents: ['claude-code', 'codex'],
  },
];

const ARTIFACT_MATRIX: ArtifactMatrixCase[] = HOST_CASES.flatMap((host) => {
  return TARGET_IDS.flatMap((target) => {
    return [false, true].flatMap((zod) => {
      return TESTING_CHOICES.map((testing) => {
        return {
          ...host,
          target,
          zod,
          testing,
        };
      });
    });
  });
});

const HOOK_TARGETS: string[] = [
  'plugins/linteljs/hooks/hooks.json',
  'plugins/linteljs/hooks/commandParser.js',
  'plugins/linteljs/hooks/eslint-fix-warning.sh',
  'plugins/linteljs/hooks/git-safety-guard.sh',
  'plugins/linteljs/hooks/banned-pattern-guard.sh',
];

const SKILL_ROUTES: SkillExpectation[] = [
  {
    label: 'repository structure',
    text: 'Read `references/repo-structure.md` before adding, moving, or renaming files.',
  },
  {
    label: 'typed source',
    text: 'Read `references/type-standards.md` before editing typed source.',
  },
  {
    label: 'Zod schemas and APIs',
    text: 'Also read `references/type-standards-zod.md` when it exists and the work touches schemas or API code.',
  },
  {
    label: 'framework state',
    text: 'Before changing state, read each emitted framework state reference in `references/`.',
  },
  {
    label: 'tests',
    text: 'Read `references/testing.md` before editing tests, mocks, or test setup.',
  },
];

const SKILL_COMMANDS: SkillExpectation[] = [
  {
    label: 'hook guardrail review',
    text: 'Treat hooks as guardrails, not a security sandbox, and review every command before running it.',
  },
  {
    label: 'check',
    text: 'Run the package-manager `check` command before declaring implementation work complete.',
  },
  {
    label: 'lint fix',
    text: 'Run the package-manager `lint:fix` command, not lint without fixes.',
  },
];

// The same line both adapters carry: with --amend banned, the default has to be set before the first commit.
const TRAILER_POLICY = '- Commit messages carry no `Co-Authored-By` or tool-attribution trailers.';

const BANNED_GIT_OPERATIONS = [
  'git stash',
  'git reset',
  '--no-verify',
  '--amend',
  'git add -A',
  'git add .',
];

const answersFor = (agents: Agent[], plugins: Plugin[] = DEFAULT_ANSWERS.plugins): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    agents,
    plugins,
  };
};

const answersForMatrix = ({
  agents,
  target,
  zod,
  testing,
}: ArtifactMatrixCase): Answers => {
  return {
    ...DEFAULT_ANSWERS,
    agents,
    target,
    libraries: zod ? ['zod'] : [],
    testing,
  };
};

const targetsFor = (agents: Agent[]): string[] => {
  return agentArtifacts(answersFor(agents)).map(({ target }) => {
    return target;
  });
};

const artifactFor = (
  agents: Agent[],
  target: string,
  plugins?: Plugin[],
): Artifact | undefined => {
  return agentArtifacts(answersFor(agents, plugins)).find((artifact) => {
    return artifact.target === target;
  });
};

const contentFor = async (
  agents: Agent[],
  target: string,
  plugins?: Plugin[],
): Promise<string> => {
  const artifact = artifactFor(agents, target, plugins);

  expect(artifact).toBeDefined();

  return artifact === undefined ? '' : await contentOf(artifact.content);
};

const parseSkill = (text: string): SkillDocument => {
  const match = /^---\n([\s\S]+?)\n---\n\n([\s\S]+)$/u.exec(text);

  if (match?.[1] === undefined || match[2] === undefined) {
    throw new Error('SKILL.md must contain closed YAML frontmatter and a body');
  }

  const entries = match[1].split('\n').map((line): [string, string] => {
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
  const text = await contentFor(['claude-code'], 'plugins/linteljs/skills/linteljs/SKILL.md');

  return parseSkill(text);
};

const nonPreservedTargetsFor = (entry: ArtifactMatrixCase): string[] => {
  return agentArtifacts(answersForMatrix(entry))
    .filter(({ preserve }) => {
      return preserve !== true;
    })
    .map(({ target }) => {
      return target;
    });
};

describe('agentArtifacts', () => {
  it('emits only the selected Claude adapter and manifests', () => {
    const targets = targetsFor(['claude-code']);

    expect(targets).toContain('CLAUDE.md');
    expect(targets).toContain('.claude/settings.json');
    expect(targets).not.toContain('AGENTS.md');
    expect(targets).not.toContain('.agents/plugins/marketplace.json');
    expect(targets).toContain('plugins/linteljs/.claude-plugin/plugin.json');
    expect(targets).toContain('plugins/linteljs/.claude-plugin/marketplace.json');
    expect(targets).not.toContain('plugins/linteljs/.codex-plugin/plugin.json');
  });

  it('emits only the selected Codex adapter and manifest', () => {
    const targets = targetsFor(['codex']);

    expect(targets).toContain('AGENTS.md');
    expect(targets).toContain('.agents/plugins/marketplace.json');
    expect(targets).not.toContain('CLAUDE.md');
    expect(targets).not.toContain('.claude/settings.json');
    expect(targets).toContain('plugins/linteljs/.codex-plugin/plugin.json');
    expect(targets).not.toContain('plugins/linteljs/.claude-plugin/plugin.json');
    expect(targets).not.toContain('plugins/linteljs/.claude-plugin/marketplace.json');
  });

  it('shares one skill and reference set between both selected hosts', () => {
    const both = targetsFor(['claude-code', 'codex']);
    const shared = targetsFor(['claude-code']).filter((target) => {
      return target.startsWith('plugins/linteljs/skills/');
    });

    expect(both).toEqual(expect.arrayContaining(['CLAUDE.md', 'AGENTS.md']));
    expect(targetsFor(['codex']).filter((target) => {
      return target.startsWith('plugins/linteljs/skills/');
    })).toEqual(shared);
    expect(both.filter((target) => {
      return target.startsWith('plugins/linteljs/skills/');
    })).toEqual(shared);
    expect(new Set(both).size).toBe(both.length);
  });

  it('shares one executable hook set between both selected hosts', () => {
    for (const { agents } of HOST_CASES) {
      const hookArtifacts = agentArtifacts(answersFor(agents)).filter(({ target }) => {
        return target.startsWith('plugins/linteljs/hooks/');
      });

      expect(hookArtifacts.map(({ target }) => {
        return target;
      })).toEqual(HOOK_TARGETS);
      expect(hookArtifacts.filter(({ target }) => {
        return target.endsWith('.sh');
      }).every(({ executable }) => {
        return executable === true;
      })).toBe(true);
      expect(hookArtifacts.find(({ target }) => {
        return target.endsWith('/commandParser.js');
      })?.executable).toBeUndefined();
    }

    expect(targetsFor(['claude-code', 'codex']).some((target) => {
      return target.startsWith('.claude/hooks/');
    })).toBe(false);
  });

  it('marks both project-owned adapters for preservation', () => {
    expect(artifactFor(['claude-code'], 'CLAUDE.md')?.preserve).toBe(true);
    expect(artifactFor(['codex'], 'AGENTS.md')?.preserve).toBe(true);
  });

  it('keeps host declarations LintelJS-owned and passes selected plugins through', async () => {
    const claude = await contentFor(
      ['claude-code'],
      '.claude/settings.json',
      ['context7'],
    );
    const codex = await contentFor(
      ['codex'],
      '.agents/plugins/marketplace.json',
      ['frontend-design', 'ponytail'],
    );

    expect(artifactFor(['claude-code'], '.claude/settings.json')?.preserve).toBeUndefined();
    expect(artifactFor(['codex'], '.agents/plugins/marketplace.json')?.preserve).toBeUndefined();
    expect(claude).toContain('context7@claude-plugins-official');
    expect(claude).not.toContain('ponytail@ponytail');
    expect(codex.indexOf('frontend-design')).toBeLessThan(codex.indexOf('ponytail'));
  });

  it('uses the same adapter body for Claude Code and Codex', async () => {
    const expected = `# LintelJS project

- Follow \`plugins/linteljs/skills/linteljs/SKILL.md\` for project structure, types, state, and tests.
- Read \`package.json\` for exact scripts and dependency versions.
- Run \`pnpm check\` before declaring implementation work complete.
- Run \`pnpm lint:fix\`, not lint without fixes.
- Never use \`git stash\`, \`git reset\`, \`--no-verify\`, \`--amend\`, \`git add -A\`, or \`git add .\`.
- Commit messages carry no \`Co-Authored-By\` or tool-attribution trailers.
`;

    expect(await contentFor(['claude-code'], 'CLAUDE.md')).toBe(expected);
    expect(await contentFor(['codex'], 'AGENTS.md')).toBe(expected);
  });

  // npm is the one manager whose scripts need `run`; for the other three the name is the command.
  it('puts run in front of an npm script and nothing in front of the rest', async () => {
    const artifact = agentArtifacts({
      ...DEFAULT_ANSWERS,
      packageManager: 'npm',
    })
      .find((candidate) => {
        return candidate.target === 'CLAUDE.md';
      });

    expect(artifact).toBeDefined();

    const body = artifact === undefined ? '' : await contentOf(artifact.content);

    expect(body).toContain('- Run `npm run check` before declaring implementation work complete.');
    expect(body).toContain('- Run `npm run lint:fix`, not lint without fixes.');
  });

  it('ships the exact minimal local plugin metadata', async () => {
    const longDescription = "Applies the generated project's LintelJS structure, typing, testing, "
      + 'and verification standards.';

    expect(await contentFor(['claude-code'], 'plugins/linteljs/.claude-plugin/plugin.json')).toBe(`{
  "name": "linteljs",
  "version": "1.0.0",
  "description": "LintelJS project standards and safety hooks",
  "author": { "name": "Faran Ali" }
}
`);
    expect(await contentFor(['claude-code'], 'plugins/linteljs/.claude-plugin/marketplace.json')).toBe(`{
  "name": "linteljs",
  "owner": { "name": "Faran Ali" },
  "plugins": [
    {
      "name": "linteljs",
      "source": "./",
      "description": "LintelJS project standards and safety hooks"
    }
  ]
}
`);
    expect(await contentFor(['codex'], 'plugins/linteljs/.codex-plugin/plugin.json')).toBe(`{
  "name": "linteljs",
  "version": "1.0.0",
  "description": "LintelJS project standards and safety hooks",
  "author": { "name": "Faran Ali" },
  "skills": "./skills/",
  "interface": {
    "displayName": "LintelJS",
    "shortDescription": "Project structure, type-safety, and verification rules",
    "longDescription": "${longDescription}",
    "developerName": "Faran Ali",
    "category": "Developer Tools",
    "capabilities": ["Instructions", "Lifecycle hooks"],
    "defaultPrompt": ["Apply this project's LintelJS standards to my task."]
  }
}
`);
  });

  it('relies on conventional hook discovery instead of manifest hook fields', async () => {
    expect(JSON.parse(await contentFor(
      ['claude-code'],
      'plugins/linteljs/.claude-plugin/plugin.json',
    ))).not.toHaveProperty('hooks');
    expect(JSON.parse(await contentFor(
      ['codex'],
      'plugins/linteljs/.codex-plugin/plugin.json',
    ))).not.toHaveProperty('hooks');
  });
});

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

  it.each(SKILL_ROUTES)('routes $label work to its reference', async ({ text }) => {
    const { body } = await skillDocument();

    expect(body).toContain(text);
  });

  it.each(SKILL_COMMANDS)('requires the $label command', async ({ text }) => {
    const { body } = await skillDocument();

    expect(body).toContain(text);
  });

  it.each(BANNED_GIT_OPERATIONS)('bans %s', async (operation) => {
    const { body } = await skillDocument();

    expect(body).toContain(`\`${operation}\``);
  });

  it('states the commit trailer policy beside the git bans', async () => {
    const { body } = await skillDocument();

    expect(body).toContain(TRAILER_POLICY);
    // Same list, same place: directly after the operations it qualifies.
    expect(body.indexOf('- Never use `git stash`')).toBeLessThan(body.indexOf(TRAILER_POLICY));
  });
});

describe('GENERATED_AGENT_TARGETS', () => {
  it('is the closed removable inventory and excludes project-owned adapters', () => {
    expect(GENERATED_AGENT_TARGETS).toEqual([
      '.claude/settings.json',
      '.agents/plugins/marketplace.json',
      'plugins/linteljs/.claude-plugin/plugin.json',
      'plugins/linteljs/.claude-plugin/marketplace.json',
      'plugins/linteljs/.codex-plugin/plugin.json',
      'plugins/linteljs/skills/linteljs/SKILL.md',
      'plugins/linteljs/skills/linteljs/references/type-standards.md',
      'plugins/linteljs/skills/linteljs/references/repo-structure.md',
      'plugins/linteljs/skills/linteljs/references/react-state.md',
      'plugins/linteljs/skills/linteljs/references/hooks-order.md',
      'plugins/linteljs/skills/linteljs/references/vue-reactivity.md',
      'plugins/linteljs/skills/linteljs/references/svelte-reactivity.md',
      'plugins/linteljs/skills/linteljs/references/solid-reactivity.md',
      'plugins/linteljs/skills/linteljs/references/type-standards-zod.md',
      'plugins/linteljs/skills/linteljs/references/testing.md',
      'plugins/linteljs/hooks/hooks.json',
      'plugins/linteljs/hooks/commandParser.js',
      'plugins/linteljs/hooks/eslint-fix-warning.sh',
      'plugins/linteljs/hooks/git-safety-guard.sh',
      'plugins/linteljs/hooks/banned-pattern-guard.sh',
    ]);
    expect(GENERATED_AGENT_TARGETS).not.toEqual(expect.arrayContaining(['CLAUDE.md', 'AGENTS.md']));
  });

  it.each(ARTIFACT_MATRIX)(
    'contains every non-preserved $label/$target/zod=$zod/testing=$testing artifact',
    (entry) => {
      const generated = nonPreservedTargetsFor(entry);

      expect(generated.filter((target) => {
        return !GENERATED_AGENT_TARGETS.includes(target);
      })).toEqual([]);
      expect(generated.filter((target) => {
        return HOOK_TARGETS.includes(target);
      })).toEqual(HOOK_TARGETS);
    },
  );

  it('emits every target in the closed removable inventory', () => {
    const emitted = new Set(ARTIFACT_MATRIX.flatMap(nonPreservedTargetsFor));

    expect(GENERATED_AGENT_TARGETS.filter((target) => {
      return !emitted.has(target);
    })).toEqual([]);
  });
});
