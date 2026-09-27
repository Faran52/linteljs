import { spawnSync } from 'node:child_process';
import {
  access,
  constants,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import {
  dirname,
  join,
  normalize,
  relative,
} from 'node:path';
import { execPath } from 'node:process';

import { hostedAnswersFor } from '@mocks/answersFor';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { EMPTY_PROJECT, MANAGED_PATH } from '@config/constants';
import {
  type Agent,
  type Artifact,
  type Data,
  type HostedAnswers,
  type Library,
  type PackageManager,
  type TargetId,
  type Testing,
} from '@config/types';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';
import {
  managedPathsReader,
  shippedAssetsReader,
  TEMPLATES_ROOT,
} from '@disk';
import { targetCases } from '@pipeline/e2e/matrix/matrix';
import { targetFor } from '@targets';

import { buildArtifacts, seedArtifacts } from './registry';
import { buildAliases } from './utils/aliasUtils';

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

// The empty string where the answers emit no such artifact.
const textFor = async (overrides: AnswerOverrides, target: string): Promise<string> => {
  const artifact = buildArtifacts(hostedAnswersFor(overrides), EMPTY_PROJECT, 'demo-app')
    .find((candidate) => {
      return candidate.target === target;
    });

  return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
};

describe('buildArtifacts', () => {
  it.each(TARGET_IDS)('resolves every artifact for %s', async (target) => {
    const artifacts = buildArtifacts(hostedAnswersFor({
      target,
      libraries: ['zod'],
    }), EMPTY_PROJECT, 'demo-app');

    const copies = artifacts
      .flatMap((artifact) => {
      // Only a copied artifact names files on disk.
        return 'sources' in artifact.content
          ? artifact.content.sources
              .map((source) => {
                return access(join(TEMPLATES_ROOT, source), constants.R_OK);
              })
          : [];
      });

    await Promise.all(copies);

    expect(artifacts.length).toBeGreaterThan(0);
  });

  /**
   * The asset is derived from the destination, so the derivation is what has to be held against disk. Every answer
   * that opens a starter file is asked for, since a browser and a router each pick a different asset for one
   * destination.
   */
  it.each(TARGET_IDS)('resolves every seeded starter for %s', async (target) => {
    const cases: HostedAnswers[] = [
      hostedAnswersFor({ target }),
      {
        ...hostedAnswersFor({ target }),
        browser: 'firefox',
      },
      {
        ...hostedAnswersFor({ target }),
        router: 'react-router',
      },
      {
        ...hostedAnswersFor({ target }),
        router: 'tanstack-router',
      },
      {
        ...hostedAnswersFor({
          target,
          libraries: [],
        }),
        styling: 'tailwind',
        surfaces: ['popup', 'background', 'devtools-panel'],
      },
    ];

    const sources = cases
      .flatMap((answers) => {
        return seedArtifacts(answers, 'demo-app')
          .flatMap((artifact) => {
            return 'sources' in artifact.content ? artifact.content.sources : [];
          });
      });

    // One spelling per destination under each answer set: a variant and its base exclude each other by `when`.
    for (const answers of cases) {
      const targets = seedArtifacts(answers, 'demo-app')
        .map((artifact) => {
          return artifact.target;
        });

      expect(targets).toEqual([...new Set(targets)]);
    }

    const accessChecks = [...new Set(sources)]
      .map(async (source) => {
        await access(join(TEMPLATES_ROOT, source), constants.R_OK);
      });

    await Promise.all(accessChecks);

    expect(sources.length).toBeGreaterThan(0);
  });

  // Two emitters writing one path would race, and the later write would win without anyone choosing it.
  it.each(TARGET_IDS)('names each path once across both lists for %s', (target) => {
    const answers = hostedAnswersFor({
      target,
      agents: valuesOf(ANSWERS.agents.values),
      libraries: ['zod'],
    });
    const artifacts = [...seedArtifacts(answers, 'demo-app'), ...buildArtifacts(answers, EMPTY_PROJECT, 'demo-app')];
    const paths = artifacts
      .map((artifact) => {
        return artifact.target;
      });

    const duplicates = paths
      .filter((path, index) => {
        return paths.indexOf(path) !== index;
      });

    expect(duplicates).toEqual([]);
  });
});

/*
 * The project the answers write, held together as one: every file it imports is one it writes, every package it
 * imports is one it declares, every stylesheet its entry imports is there, every coverage exclusion names a file it
 * has, and every starter asset reaches some project. Read over the legal answer sets the end-to-end suite installs,
 * each also with MSW and without Zod, the two answers that suite always leaves at one value. A record that names a
 * path or a package wrongly is otherwise found only by an install or a build that cannot resolve it.
 */
describe('the project the answers write', () => {
  interface Project {
    answers: HostedAnswers;
    artifacts: Artifact[];
    // What reaches disk: a starter suite whose subject is not written is skipped, as `artifactWriter` skips it.
    written: Set<string>;
    textOf: (path: string) => Promise<string>;
  }

  const SCRIPT = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/u;
  // A static `from 'x'` or `import 'x'`, and a dynamic `import('x')`. Every starter and emitted file quotes singly.
  const SPECIFIER = /(?:from |import ?\(?)'([^']+)'/gu;
  // Relative paths, Node's builtins and a framework's virtual modules (`$app/`, `#imports`, `astro:`, `~/`).
  const NOT_A_PACKAGE = /^(?:\.|\/|node:|#|~|\$|astro:|virtual:)/u;
  // What a bundler tries after the path as written; `.js` names the `.ts` beside it under `bundler` resolution.
  const RESOLVED = ['', '.ts', '.tsx', '.vue', '.svelte', '.astro', '/index.ts'];

  const projectsFor = (target: TargetId): Project[] => {
    return targetCases(target)
      .flatMap(({ answers: chosen }) => {
        return [chosen, {
          ...chosen,
          mocking: 'msw' as const,
          libraries: [],
        }];
      })
      .map((chosen) => {
        const answers = hostedAnswersFor(chosen);
        const seeded = seedArtifacts(answers, 'demo-app');
        const artifacts = [...seeded, ...buildArtifacts(answers, EMPTY_PROJECT, 'demo-app')];
        const artifactPaths = artifacts
          .map(({ target: path }) => {
            return path;
          });

        const listed = new Set(artifactPaths);

        const writtenPaths = artifacts
          .filter(({ requires = [] }) => {
            return requires
              .every((path) => {
                return listed.has(path);
              });
          })
          .map(({ target: path }) => {
            return path;
          });

        return {
          answers,
          artifacts,
          written: new Set(writtenPaths),
          textOf: async (path) => {
            const artifact = artifacts
              .find(({ target: candidate }) => {
                return candidate === path;
              });

            return artifact === undefined ? '' : await shippedAssetsReader(artifact.content);
          },
        };
      });
  };

  const scriptsOf = async (project: Project): Promise<[string, string][]> => {
    const scriptReads = [...project.written]
      .filter((path) => {
        return SCRIPT.test(path);
      })
      .map(async (path): Promise<[string, string]> => {
        return [path, await project.textOf(path)];
      });

    return await Promise.all(scriptReads);
  };

  const specifiersIn = (text: string): string[] => {
    return [...text.matchAll(SPECIFIER)]
      .map(([, specifier = '']) => {
        return specifier;
      });
  };

  // `tsconfig` `paths`, exact before wildcard, as TypeScript and Vite both resolve them.
  const aliasedPath = (answers: HostedAnswers, specifier: string): string | undefined => {
    const aliases = {
      ...buildAliases(answers),
      ...targetFor(answers).extraAliases,
    };
    const exact = aliases[specifier];

    if (exact !== undefined) {
      return normalize(exact);
    }

    const wildcard = Object.keys(aliases)
      .find((alias) => {
        return alias.endsWith('/*') && specifier.startsWith(alias.slice(0, -1));
      });

    return wildcard === undefined
      ? undefined
      : normalize((aliases[wildcard] ?? '').replace('*', specifier.slice(wildcard.length - 1)));
  };

  it.each(TARGET_IDS)('imports no file of its own that a %s project does not write', async (target) => {
    const unresolved = new Set<string>();

    for (const project of projectsFor(target)) {
      for (const [path, text] of await scriptsOf(project)) {
        for (const specifier of specifiersIn(text)) {
          const base = specifier.startsWith('.')
            ? normalize(join(dirname(path), specifier.replace(/\.js$/u, '')))
            : aliasedPath(project.answers, specifier);

          if (base !== undefined && !RESOLVED
            .some((extension) => {
              return project.written.has(`${base}${extension}`);
            })) {
            unresolved.add(`${path} imports ${specifier}`);
          }
        }
      }
    }

    expect([...unresolved]).toEqual([]);
  });

  const declaredIn = async (project: Project): Promise<Set<string>> => {
    const declaredNames = [...(await project.textOf('package.json')).matchAll(/^ {4}"([^"]+)": "/gmu)]
      .map(([, name = '']) => {
        return name;
      });

    return new Set(declaredNames);
  };

  const packageOf = (specifier: string): string => {
    const [scope = '', name = ''] = specifier.split('/');

    return specifier.startsWith('@') ? `${scope}/${name}` : scope;
  };

  it.each(TARGET_IDS)('declares every package a %s project imports', async (target) => {
    const undeclared = new Set<string>();

    for (const project of projectsFor(target)) {
      const declared = await declaredIn(project);

      for (const [path, text] of await scriptsOf(project)) {
        for (const specifier of specifiersIn(text)) {
          if (!NOT_A_PACKAGE.test(specifier)
            && aliasedPath(project.answers, specifier) === undefined
            && !declared.has(packageOf(specifier))) {
            undeclared.add(`${path} imports ${specifier}`);
          }
        }
      }
    }

    expect([...undeclared]).toEqual([]);
  });

  // A relative import is a file the project writes; any other is a package it declares, Tailwind's own among them.
  it.each(TARGET_IDS)('writes or declares every stylesheet the %s style entry imports', async (target) => {
    const missing = new Set<string>();

    for (const project of projectsFor(target)) {
      const { styleEntry } = targetFor(project.answers);
      const declared = await declaredIn(project);

      for (const [, specifier = ''] of (await project.textOf(styleEntry)).matchAll(/@import "([^"]*)"/gu)) {
        const found = specifier.startsWith('.')
          ? project.written.has(normalize(join(dirname(styleEntry), specifier)))
          : declared.has(packageOf(specifier));

        if (!found) {
          missing.add(`${styleEntry} imports ${specifier}`);
        }
      }
    }

    expect([...missing]).toEqual([]);
  });

  it.each(TARGET_IDS)('excludes from the %s coverage only files the project writes', (target) => {
    const stale = new Set<string>();

    for (const project of projectsFor(target)) {
      for (const path of targetFor(project.answers).coverageExclude ?? []) {
        if (!path.includes('*') && !project.written.has(path)) {
          stale.add(path);
        }
      }
    }

    expect([...stale]).toEqual([]);
  });

  // A suite gated on a file no answer writes is a suite no project ever gets.
  it.each(TARGET_IDS)('writes every %s starter suite under some answers', (target) => {
    const projects = projectsFor(target);
    const requiring = projects
      .flatMap(({ artifacts }) => {
        return artifacts
          .filter(({ requires }) => {
            return requires !== undefined;
          })
          .map(({ target: path }) => {
            return path;
          });
      });

    const suites = new Set(requiring);

    const unwritten = [...suites]
      .filter((suite) => {
        return !projects
          .some(({ written }) => {
            return written.has(suite);
          });
      });

    expect(unwritten).toEqual([]);
  });

  // Each asset is read from a file, and every file under `starter-source/` is read by some project.
  it('reads every starter asset some project is written from, and no other', async () => {
    const copiedSources = TARGET_IDS
      .flatMap((target) => {
        return projectsFor(target)
          .flatMap(({ artifacts }) => {
            return artifacts
              .flatMap(({ content }) => {
                return 'sources' in content ? content.sources : [];
              });
          });
      });

    const sources = new Set(copiedSources);
    const assets = (await readdir(join(TEMPLATES_ROOT, 'starter-source'), {
      withFileTypes: true,
      recursive: true,
    }))
      .filter((entry) => {
        return entry.isFile();
      })
      .map((entry) => {
        return relative(TEMPLATES_ROOT, join(entry.parentPath, entry.name));
      });

    const missingAssets = [...sources]
      .filter((source) => {
        return source.startsWith('starter-source/') && !assets.includes(source);
      });

    expect(missingAssets).toEqual([]);

    const unusedAssets = assets
      .filter((asset) => {
        return !sources.has(asset);
      });

    expect(unusedAssets).toEqual([]);
  });
});

// Nothing else runs the checker against starter code: `pnpm check` never invokes it and e2e never commits.
describe('the emitted checker against the emitted starter code', () => {
  const CHECKER = 'scripts/checkBannedPatterns.ts';

  // A composed artifact is only scannable once composed.
  const scannedFor = async (target: TargetId): Promise<ScannedArtifact[]> => {
    const files = [
      ...buildArtifacts(hostedAnswersFor({
        target,
        libraries: [],
        data: 'tanstack-query',
      }), EMPTY_PROJECT, 'demo-app')
        .flatMap((artifact) => {
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
      ...seedArtifacts(hostedAnswersFor({ target }), 'demo-app')
        .flatMap((artifact) => {
          return 'sources' in artifact.content
            ? artifact.content.sources
                .map((source) => {
                  return {
                    target: artifact.target,
                    read: async () => {
                      return await readFile(join(TEMPLATES_ROOT, source), 'utf8');
                    },
                  };
                })
            : [];
        }),
    ]
      .filter(({ target: path }) => {
        return /\.[cm]?tsx?$/.test(path);
      });

    const texts = files
      .map(async ({ target: path, read }) => {
        return {
          target: path,
          text: await read(),
        };
      });

    return await Promise.all(texts);
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
        scanned
          .some(({ target: path }) => {
            return path === 'scripts/typecheckStaged.ts';
          }),
        scanned
          .filter(({ target: path }) => {
            return path.startsWith('src/');
          }).length > 1,
      ]).toEqual([true, true]);

      // Relative paths, which is what lint-staged hands it.
      const { status, stderr } = spawnSync(
        execPath,
        [CHECKER, ...scanned
          .map(({ target: path }) => {
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

    const sortedRemovable = [...removable]
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      });

    expect(removable).toEqual(sortedRemovable);
    /*
     * Otherwise the assertion above holds vacuously. Only a mixed-case pair tells the two comparators apart, and
     * `SKILL.md` beside the `references/` in the same directory is the pair a bare `.sort()` reorders. A set that
     * loses its last such pair fails here rather than going quietly toothless.
     */
    expect(removable).not.toEqual([...removable].toSorted(byCodeUnit));
  });
});
