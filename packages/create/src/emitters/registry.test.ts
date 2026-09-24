import { spawnSync } from 'node:child_process';
import {
  access,
  constants,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execPath } from 'node:process';

import { HOSTED_DEFAULTS } from '@mocks/hostedAnswers';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { MANAGED_PATH } from '@config/constants';

import { valuesOf } from '@utils/objectUtils';

import {
  type Agent,
  ANSWERS,
  type Data,
  type HostedAnswers,
  type Library,
  type PackageManager,
  type TargetId,
  type Testing,
} from '@answers';
import {
  managedPathsReader,
  shippedAssetsReader,
  TEMPLATES_ROOT,
} from '@disk';

import { buildArtifacts, seedArtifacts } from './registry';

interface AnswerOverrides {
  agents?: Agent[];
  target?: TargetId;
  testing?: Testing;
  libraries?: Library[];
  packageManager?: PackageManager;
  data?: Data;
}

// Only the path and the text are read back off a composed artifact.
interface ScannedArtifact {
  target: string;
  text: string;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const answersFor = (overrides: AnswerOverrides): HostedAnswers => {
  return {
    ...HOSTED_DEFAULTS,
    ...overrides,
  };
};

// The empty string where the answers emit no such artifact.
const textFor = async (overrides: AnswerOverrides, target: string): Promise<string> => {
  const artifact = buildArtifacts(answersFor(overrides)).find((candidate) => {
    return candidate.target === target;
  });

  return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
};

describe('buildArtifacts', () => {
  it.each(TARGET_IDS)('resolves every artifact for %s', async (target) => {
    const artifacts = buildArtifacts(answersFor({
      target,
      libraries: ['zod'],
    }));

    await Promise.all(artifacts.flatMap((artifact) => {
      // Only a copied artifact names files on disk.
      return 'sources' in artifact.content
        ? artifact.content.sources.map((source) => {
            return access(join(TEMPLATES_ROOT, source), constants.R_OK);
          })
        : [];
    }));

    expect(artifacts.length).toBeGreaterThan(0);
  });

  /**
   * What replaced the `source` a record used to carry beside each `target`: the asset is derived from the
   * destination now, so the derivation is what has to be held against disk. Every answer that opens a starter file
   * is asked for, since a browser and a router each pick a different asset for one destination.
   */
  it.each(TARGET_IDS)('resolves every seeded starter for %s', async (target) => {
    const cases: HostedAnswers[] = [
      answersFor({ target }),
      {
        ...answersFor({ target }),
        browser: 'firefox',
      },
      {
        ...answersFor({ target }),
        router: 'react-router',
      },
      {
        ...answersFor({ target }),
        router: 'tanstack-router',
      },
      {
        ...answersFor({
          target,
          libraries: [],
        }),
        styling: 'tailwind',
        surfaces: ['popup', 'background', 'devtools-panel'],
      },
    ];

    const sources = cases.flatMap((answers) => {
      return seedArtifacts(answers, 'demo-app').flatMap((artifact) => {
        return 'sources' in artifact.content ? artifact.content.sources : [];
      });
    });

    await Promise.all([...new Set(sources)].map(async (source) => {
      await access(join(TEMPLATES_ROOT, source), constants.R_OK);
    }));

    expect(sources.length).toBeGreaterThan(0);
  });

  // Two emitters writing one path would race, and the later write would win without anyone choosing it.
  it.each(TARGET_IDS)('names each path once across both lists for %s', (target) => {
    const answers = answersFor({
      target,
      agents: valuesOf(ANSWERS.agents.values),
      libraries: ['zod'],
    });
    const paths = [...seedArtifacts(answers, 'demo-app'), ...buildArtifacts(answers)].map((artifact) => {
      return artifact.target;
    });

    expect(paths.filter((path, index) => {
      return paths.indexOf(path) !== index;
    })).toEqual([]);
  });
});

// Nothing else runs the checker against starter code: `pnpm check` never invokes it and e2e never commits.
describe('the emitted checker against the emitted starter code', () => {
  const CHECKER = 'scripts/checkBannedPatterns.ts';

  // A composed artifact is only scannable once composed.
  const scannedFor = async (target: TargetId): Promise<ScannedArtifact[]> => {
    const files = [
      ...buildArtifacts(answersFor({
        target,
        libraries: [],
        data: 'tanstack-query',
      })).flatMap((artifact) => {
        return 'text' in artifact.content || artifact.target === CHECKER
          ? []
          : [{
              target: artifact.target,
              read: async () => {
                return await shippedAssetsReader(artifact.content);
              },
            }];
      }),
      // Through `seedArtifacts` rather than off the record: the record names the destination and the emitter derives
      // the asset from it, so reading the record directly would scan a path nothing writes.
      ...seedArtifacts(answersFor({ target }), 'demo-app').flatMap((artifact) => {
        return 'sources' in artifact.content
          ? artifact.content.sources.map((source) => {
              return {
                target: artifact.target,
                read: async () => {
                  return await readFile(join(TEMPLATES_ROOT, source), 'utf8');
                },
              };
            })
          : [];
      }),
    ].filter(({ target: path }) => {
      return /\.[cm]?tsx?$/.test(path);
    });

    return await Promise.all(files.map(async ({ target: path, read }) => {
      return {
        target: path,
        text: await read(),
      };
    }));
  };

  it.each(TARGET_IDS)('passes on everything %s is generated with', async (target) => {
    const cwd = await mkdtemp(join(tmpdir(), 'linteljs-floor-'));

    try {
      const checker = await textFor({ target }, CHECKER);
      const scanned = await scannedFor(target);

      await mkdir(join(cwd, dirname(CHECKER)), { recursive: true });
      await writeFile(join(cwd, CHECKER), checker, 'utf8');

      for (const file of scanned) {
        await mkdir(dirname(join(cwd, file.target)), { recursive: true });
        await writeFile(join(cwd, file.target), file.text, 'utf8');
      }

      /*
       * A checker spawned with no files exits 0, so the assertion below says nothing until the list is real. Both
       * arms of `scannedFor` have to land: the generated scripts and the starter tree. This is `lint:starters`
       * reporting zero findings over files it never read, in miniature, and it passed with `scanned` emptied.
       */
      expect([
        scanned.some(({ target: path }) => {
          return path === 'scripts/typecheckStaged.ts';
        }),
        scanned.filter(({ target: path }) => {
          return path.startsWith('src/');
        }).length > 1,
      ]).toEqual([true, true]);

      // Relative paths, which is what lint-staged hands it.
      const { status, stderr } = spawnSync(
        execPath,
        [CHECKER, ...scanned.map(({ target: path }) => {
          return path;
        })],
        {
          cwd,
          encoding: 'utf8',
        },
      );

      expect(`${String(status)}\n${stderr}`).toBe('0\n');
    }
    finally {
      await rm(cwd, {
        recursive: true,
        force: true,
      });
    }
  });
});

/*
 * A generated project keeps `managed.json` in version control, so the order of its entries is part of what this CLI
 * emits: move the comparator and every consumer's next `sync` is a diff of pure churn. Pinned as the ordering
 * property rather than as a snapshot of the file, so a new emitter costs nothing and a moved comparator costs a
 * red test. Read back through the reader `sync` itself uses, which is the order that actually matters.
 */
describe('the managed record', () => {
  const removableOf = async (overrides: AnswerOverrides): Promise<string[]> => {
    const cwd = await mkdtemp(join(tmpdir(), 'linteljs-managed-'));
    const written = join(cwd, MANAGED_PATH);

    try {
      await mkdir(dirname(written), { recursive: true });
      await writeFile(written, await textFor(overrides, MANAGED_PATH), 'utf8');

      return await managedPathsReader(cwd);
    }
    finally {
      await rm(cwd, {
        recursive: true,
        force: true,
      });
    }
  };

  // What a bare `.sort()` would give, spelled out because the lint layer rightly refuses to let a test write one.
  const byCodeUnit = (left: string, right: string): number => {
    return left < right ? -1 : Number(left > right);
  };

  // One case per group that contributes paths of its own: the agent files, the manager files and the rules.
  it.each<[string, AnswerOverrides]>([
    ['the defaults', {}],
    ['every agent, zod and npm', {
      agents: [
        'claude-code',
        'codex',
        'copilot',
        'cursor',
      ],
      libraries: ['zod'],
      packageManager: 'npm',
    }],
    ['no agent and no suite', {
      agents: [],
      testing: 'none',
    }],
    ['yarn', { packageManager: 'yarn' }],
  ])('orders %s by locale rather than by code unit', async (_case, overrides) => {
    const removable = await removableOf(overrides);

    expect(removable).toEqual([...removable].toSorted((left, right) => {
      return left.localeCompare(right, 'en');
    }));
    /*
     * Otherwise the assertion above holds vacuously. Only a mixed-case pair tells the two comparators apart, and
     * `SKILL.md` beside the `references/` in the same directory is the pair a bare `.sort()` reorders. A set that
     * loses its last such pair fails here rather than going quietly toothless.
     */
    expect(removable).not.toEqual([...removable].toSorted(byCodeUnit));
  });
});
