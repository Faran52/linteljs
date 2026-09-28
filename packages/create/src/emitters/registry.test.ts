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
  type Surface,
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

interface ScannedArtifact {
  target: string;
  text: string;
}

const TARGET_IDS = valuesOf(ANSWERS.target.values);

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

describe('the page a target serves', () => {
  it.each(TARGET_IDS)('mounts %s on the element its index.html carries', async (target) => {
    const answers = hostedAnswersFor({ target });
    const artifacts = [...seedArtifacts(answers, 'demo-app'), ...buildArtifacts(answers, EMPTY_PROJECT, 'demo-app')];
    const page = artifacts
      .find((artifact) => {
        return artifact.target === 'index.html';
      });

    if (page === undefined) {
      return;
    }

    const html = await shippedAssetsReader(page.content);
    const rootId = /<div id="([^"]+)"><\/div>/u.exec(html)?.[1];
    const entryPath = /<script type="module" src="\/([^"]+)"><\/script>/u.exec(html)?.[1];
    const entry = artifacts
      .find((artifact) => {
        return artifact.target === entryPath;
      });
    const entryText = entry === undefined ? '' : await shippedAssetsReader(entry.content);

    expect(entryText).toMatch(new RegExp(`['"]#?${String(rootId)}['"]`, 'u'));
  });
});

describe('the project the answers write', () => {
  interface Project {
    answers: HostedAnswers;
    artifacts: Artifact[];
    written: Set<string>;
    textOf: (path: string) => Promise<string>;
  }

  const SCRIPT = /\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/u;
  const SPECIFIER = /(?:from |import ?\(?)'([^']+)'/gu;
  const NOT_A_PACKAGE = /^(?:\.|\/|node:|#|~|\$|astro:|virtual:)/u;
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

describe('the files a webextension surface owns', () => {
  const OWNED: Record<Surface, string[]> = {
    'popup': [
      'index.html',
      'src/lib/mark/mark.css',
      'src/lib/mark/mark.ts',
      'src/main.ts',
      'src/popup/renderPopup.test.ts',
      'src/popup/renderPopup.ts',
    ],
    'background': [
      'src/background/index.ts',
      'src/background/onInstalled.test.ts',
      'src/background/onInstalled.ts',
    ],
    'devtools-panel': [
      'devtools.html',
      'panel.html',
      'src/devtools/index.ts',
      'src/panel/index.ts',
      'src/panel/renderPanel.test.ts',
      'src/panel/renderPanel.ts',
    ],
  };
  const SURFACE_PATH = /^(?:[^/]+\.html|src\/(?:main\.ts|popup\/|background\/|devtools\/|panel\/|lib\/mark\/))/u;
  const SURFACES = valuesOf(ANSWERS.surfaces.values);

  const byLocale = (left: string, right: string): number => {
    return left.localeCompare(right, 'en');
  };

  const combinations = SURFACES
    .reduce<Surface[][]>((subsets, surface) => {
      return [...subsets, ...subsets
        .map((subset) => {
          return [...subset, surface];
        })];
    }, [[]])
    .map((surfaces): [string, Surface[]] => {
      return [surfaces.join(' + ') || 'no surface', surfaces];
    });

  it.each(combinations)('writes exactly what %s names', (_label, surfaces) => {
    const answers = {
      ...hostedAnswersFor({ target: 'webextension' }),
      styling: 'tailwind' as const,
      surfaces,
    };
    const artifacts = [...seedArtifacts(answers, 'demo-app'), ...buildArtifacts(answers, EMPTY_PROJECT, 'demo-app')];
    const writtenPaths = artifacts
      .map(({ target: path }) => {
        return path;
      })
      .filter((path) => {
        return SURFACE_PATH.test(path);
      })
      .toSorted(byLocale);
    const expectedPaths = surfaces
      .flatMap((surface) => {
        return OWNED[surface];
      })
      .toSorted(byLocale);
    const html = targetFor(answers).html;

    expect(writtenPaths).toEqual(expectedPaths);
    expect(html).toBe(surfaces.includes('popup') || surfaces.includes('devtools-panel'));
  });
});

describe('the emitted checker against the emitted starter code', () => {
  const CHECKER = 'scripts/checkBannedPatterns.ts';

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

  const byCodeUnit = (left: string, right: string): number => {
    return left < right ? -1 : Number(left > right);
  };

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
    expect(removable).not.toEqual([...removable].toSorted(byCodeUnit));
  });
});
