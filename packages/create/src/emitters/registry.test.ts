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

import {
  EMPTY_PROJECT,
  LANGUAGES,
  MANAGED_PATH,
} from '@config/constants';
import {
  type Agent,
  type Answers,
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
  const answers = hostedAnswersFor(overrides);
  const artifact = buildArtifacts(answers, EMPTY_PROJECT, 'demo-app')
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
                const sourcePath = join(TEMPLATES_ROOT, source);

                return access(sourcePath, constants.R_OK);
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
        surfaces: [
          'popup',
          'background',
          'devtools-panel',
        ],
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

      const expected = [...new Set(targets)];
      expect(targets).toEqual(expected);
    }

    const uniqueSources = [...new Set(sources)];
    const accessChecks = uniqueSources
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

it('keeps next dev from rewriting the agent files a next project owns', async () => {
  const answers = hostedAnswersFor({ target: 'next' });
  const config = seedArtifacts(answers, 'demo-app')
    .find((artifact) => {
      return artifact.target === 'next.config.ts';
    });
  const text = config === undefined ? '' : await shippedAssetsReader(config.content);

  expect(text).toContain('agentRules: false');
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
  const RESOLVED = [
    '',
    '.ts',
    '.tsx',
    '.vue',
    '.svelte',
    '.astro',
    '/index.ts',
  ];
  // Written by `svelte-kit sync` and the i18n compiler, never by the scaffolder.
  const GENERATED = '.svelte-kit/';

  const projectsFor = (target: TargetId): Project[] => {
    return targetCases(target)
      .flatMap(({ answers: chosen }) => {
        const variants: Answers[] = [
          chosen,
          {
            ...chosen,
            mocking: 'msw',
            libraries: [],
          },
        ];

        if (targetFor(chosen).i18n !== undefined) {
          variants.push({
            ...chosen,
            languages: [...LANGUAGES],
          });
        }

        return variants;
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

        const project: Project = {
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

        return project;
      });
  };

  const scriptsOf = async (project: Project): Promise<[string, string][]> => {
    const writtenPaths = [...project.written];
    const scriptReads = writtenPaths
      .filter((path) => {
        return SCRIPT.test(path);
      })
      .map(async (path): Promise<[string, string]> => {
        const text = await project.textOf(path);
        const script: [string, string] = [path, text];

        return script;
      });

    const scripts = await Promise.all(scriptReads);

    return scripts;
  };

  const specifiersIn = (text: string): string[] => {
    const matches = [...text.matchAll(SPECIFIER)];

    return matches
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
        const aliasPrefix = alias.slice(0, -1);
        return alias.endsWith('/*') && specifier.startsWith(aliasPrefix);
      });

    if (wildcard === undefined) {
      return undefined;
    }

    const aliasTarget = aliases[wildcard] ?? '';
    const resolved = aliasTarget.replace('*', specifier.slice(wildcard.length - 1));

    return normalize(resolved);
  };

  it.each(TARGET_IDS)('imports no file of its own that a %s project does not write', async (target) => {
    const unresolved = new Set<string>();

    for (const project of projectsFor(target)) {
      const scripts = await scriptsOf(project);

      for (const [path, text] of scripts) {
        for (const specifier of specifiersIn(text)) {
          const stem = specifier.replace(/\.js$/u, '');
          const relativePath = join(dirname(path), stem);
          const base = specifier.startsWith('.')
            ? normalize(relativePath)
            : aliasedPath(project.answers, specifier);

          if (base !== undefined && !base.startsWith(GENERATED) && !RESOLVED
            .some((extension) => {
              return project.written.has(`${base}${extension}`);
            })) {
            unresolved.add(`${path} imports ${specifier}`);
          }
        }
      }
    }

    const actual = [...unresolved];
    expect(actual).toEqual([]);
  });

  const declaredIn = async (project: Project): Promise<Set<string>> => {
    const packageJson = await project.textOf('package.json');
    const entries = [...packageJson.matchAll(/^ {4}"([^"]+)": "/gmu)];
    const declaredNames = entries
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
      const scripts = await scriptsOf(project);

      for (const [path, text] of scripts) {
        for (const specifier of specifiersIn(text)) {
          const specifierPackage = packageOf(specifier);

          if (!NOT_A_PACKAGE.test(specifier)
            && aliasedPath(project.answers, specifier) === undefined
            && !declared.has(specifierPackage)) {
            undeclared.add(`${path} imports ${specifier}`);
          }
        }
      }
    }

    const actual = [...undeclared];
    expect(actual).toEqual([]);
  });

  it.each(TARGET_IDS)('writes or declares every stylesheet the %s style entry imports', async (target) => {
    const missing = new Set<string>();

    for (const project of projectsFor(target)) {
      const { styleEntry } = targetFor(project.answers);
      const declared = await declaredIn(project);

      const styleText = await project.textOf(styleEntry);
      const styleDir = dirname(styleEntry);

      for (const [, specifier = ''] of styleText.matchAll(/@import "([^"]*)"/gu)) {
        const importedPath = normalize(join(styleDir, specifier));
        const importedPackage = packageOf(specifier);
        const found = specifier.startsWith('.')
          ? project.written.has(importedPath)
          : declared.has(importedPackage);

        if (!found) {
          missing.add(`${styleEntry} imports ${specifier}`);
        }
      }
    }

    const actual = [...missing];
    expect(actual).toEqual([]);
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

    const actual = [...stale];
    expect(actual).toEqual([]);
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

    const suites = [...new Set(requiring)];

    const unwritten = suites
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
    const starterSource = join(TEMPLATES_ROOT, 'starter-source');
    const entries = await readdir(starterSource, {
      withFileTypes: true,
      recursive: true,
    });
    const assets = entries
      .filter((entry) => {
        return entry.isFile();
      })
      .map((entry) => {
        const assetPath = join(entry.parentPath, entry.name);

        return relative(TEMPLATES_ROOT, assetPath);
      });

    const uniqueSources = [...sources];
    const missingAssets = uniqueSources
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
      const withSurface = subsets
        .map((subset) => {
          const extended = [...subset, surface];

          return extended;
        });
      const grown = [...subsets, ...withSurface];

      return grown;
    }, [[]])
    .map((surfaces): [string, Surface[]] => {
      const label = surfaces.join(' + ') || 'no surface';
      const row: [string, Surface[]] = [label, surfaces];

      return row;
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
    const { html } = targetFor(answers);

    expect(writtenPaths).toEqual(expectedPaths);
    expect(html).toBe(surfaces.includes('popup') || surfaces.includes('devtools-panel'));
  });
});

describe('the emitted checker against the emitted starter code', () => {
  const CHECKER = 'scripts/checkBannedPatterns.ts';

  const scannedFor = async (target: TargetId): Promise<ScannedArtifact[]> => {
    const builtAnswers = hostedAnswersFor({
      target,
      libraries: [],
      data: 'tanstack-query',
    });
    const seededAnswers = hostedAnswersFor({ target });
    const emitted = buildArtifacts(builtAnswers, EMPTY_PROJECT, 'demo-app')
      .filter((artifact) => {
        return !('text' in artifact.content) && artifact.target !== CHECKER;
      })
      .map((artifact) => {
        const file = {
          target: artifact.target,
          read: async () => {
            const text = await shippedAssetsReader(artifact.content);

            return text;
          },
        };

        return file;
      });
    const copied = seedArtifacts(seededAnswers, 'demo-app')
      .flatMap((artifact) => {
        return 'sources' in artifact.content
          ? artifact.content.sources
              .map((source) => {
                const sourcePath = join(TEMPLATES_ROOT, source);
                const file = {
                  target: artifact.target,
                  read: async () => {
                    const text = await readFile(sourcePath, 'utf8');

                    return text;
                  },
                };

                return file;
              })
          : [];
      });
    const files = [...emitted, ...copied];
    const typescriptFiles = files
      .filter(({ target: path }) => {
        return /\.[cm]?tsx?$/.test(path);
      });

    const texts = typescriptFiles
      .map(async ({ target: path, read }) => {
        const text = await read();
        const scanned: ScannedArtifact = {
          target: path,
          text,
        };

        return scanned;
      });

    const scanned = await Promise.all(texts);

    return scanned;
  };

  it.each(TARGET_IDS)('passes on everything %s is generated with', async (target) => {
    const tempPrefix = join(tmpdir(), 'linteljs-floor-');
    const cwd = await mkdtemp(tempPrefix);

    try {
      const checker = await textFor({ target }, CHECKER);
      const scanned = await scannedFor(target);

      const scriptsDir = join(cwd, dirname(CHECKER));

      await mkdir(scriptsDir, { recursive: true });
      await writeFile(join(cwd, CHECKER), checker, 'utf8');

      for (const file of scanned) {
        const filePath = join(cwd, file.target);

        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, file.text, 'utf8');
      }

      const actual = [
        scanned
          .some(({ target: path }) => {
            return path === 'scripts/typecheckStaged.ts';
          }),
        scanned
          .filter(({ target: path }) => {
            return path.startsWith('src/');
          }).length > 1,
      ];
      const expected = [true, true];
      expect(actual).toEqual(expected);

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
    const tempPrefix = join(tmpdir(), 'linteljs-managed-');
    const cwd = await mkdtemp(tempPrefix);
    const written = join(cwd, MANAGED_PATH);

    try {
      const managedText = await textFor(overrides, MANAGED_PATH);

      await mkdir(dirname(written), { recursive: true });
      await writeFile(written, managedText, 'utf8');

      const removable = await managedPathsReader(cwd);

      return removable;
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

    const localeOrder = removable
      .toSorted((left, right) => {
        return left.localeCompare(right, 'en');
      });
    const codeUnitOrder = removable.toSorted(byCodeUnit);

    expect(removable).toEqual(localeOrder);
    expect(removable).not.toEqual(codeUnitOrder);
  });
});
