import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { alphabetically } from '@mocks/fixerSamples';
import { moduleNameOf, rulesDir } from '@mocks/ruleTree';
import { ESLint, type Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { FIX_SHAPES, TYPESCRIPT_FILES } from './constants';
import plugin, {
  configs,
  PLUGIN_NAME,
  rules,
} from './index';
import { docsUrl } from './utils/ruleUtils';

import type { LintelRuleModule, RuleLanguage } from './types';

const root = join(import.meta.dirname, '..');

const filesIn = (ruleName: string): string[] => {
  const ruleDir = join(rulesDir, ruleName);
  const entries = readdirSync(ruleDir, {
    withFileTypes: true,
    recursive: true,
  });

  return entries
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);

      return relative(ruleDir, path);
    });
};

const requiredFiles = (ruleName: string): string[] => {
  const module = moduleNameOf(ruleName);

  const files = [
    `${module}.ts`,
    `${module}.test.ts`,
    'README.md',
  ];

  return files;
};

const readJson = (path: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(readFileSync(join(root, path), 'utf8'));

  if (typeof parsed !== 'object' || parsed === null) {
    throw new TypeError(`${path} is not an object`);
  }

  const record = { ...parsed };

  return record;
};

const enabledIn = (preset: Linter.Config[]): string[] => {
  return preset
    .flatMap((config) => {
      return Object.keys(config.rules ?? {});
    })
    .toSorted(alphabetically);
};

const PRESET_NAMES = ['recommended', 'all'] as const;

const recommendedNames = Object.entries(rules)
  .filter(([, rule]) => {
    return rule.meta.docs.recommended;
  })
  .map(([name]) => {
    return name;
  });

const packageJson = readJson('package.json');
const ruleNames = Object.keys(rules);
const ruleCases: [string, LintelRuleModule][] = Object.entries(rules);

const prefixed = (names: string[]): string[] => {
  return names
    .map((name) => {
      return `${PLUGIN_NAME}/${name}`;
    })
    .toSorted(alphabetically);
};

const languagesOf = (ids: string[]): RuleLanguage[] => {
  const enabled = new Set(ids);

  return ruleCases
    .filter(([name]) => {
      return enabled.has(`${PLUGIN_NAME}/${name}`);
    })
    .map(([, rule]) => {
      return rule.meta.docs.language;
    });
};

describe('plugin shape', () => {
  it('reports a version matching package.json', () => {
    expect(plugin.meta?.version).toBe(packageJson['version']);
  });

  it('reports a name matching package.json', () => {
    expect(plugin.meta?.name).toBe(packageJson['name']);
  });

  it('declares no runtime dependencies', () => {
    expect(packageJson['dependencies']).toBeUndefined();
  });
});

describe.each(ruleCases)('rule "%s"', (name, rule) => {
  const { meta } = rule;

  it('declares a description written as a sentence', () => {
    expect(meta.docs.description.length).toBeGreaterThan(10);
    expect(meta.docs.description).toMatch(/\.$/);
  });

  it('declares a fix shape only where there is a fixer to shape', () => {
    const { fixShape } = meta.docs;

    const actual = [...FIX_SHAPES, undefined];
    expect(actual).toContain(fixShape);
    expect(fixShape === undefined || meta.fixable !== undefined).toBe(true);
  });

  it('derives its docs url from its id', () => {
    expect(meta.docs.url).toBe(docsUrl(name));
  });

  it('holds its rule, its suite, its doc and nothing else but helpers under utils', () => {
    const ownFiles = filesIn(name)
      .filter((file) => {
        return !/^utils\/[^/]+\.ts$/.test(file);
      })
      .toSorted(alphabetically);

    const required = requiredFiles(name)
      .toSorted(alphabetically);

    expect(ownFiles).toEqual(required);
  });

  it('declares a valid rule type', () => {
    const actual = [
      'problem',
      'suggestion',
      'layout',
    ];
    expect(actual).toContain(meta.type);
  });

  it('declares at least one message', () => {
    expect(Object.keys(meta.messages ?? {}).length).toBeGreaterThan(0);
  });

  it('writes messages without em-dashes', () => {
    for (const message of Object.values(meta.messages ?? {})) {
      expect(message).not.toMatch(/[—–]/);
    }

    expect(meta.docs.description).not.toMatch(/[—–]/);
  });

  it('rejects unknown options in every object schema', () => {
    const { schema } = meta;

    const actual = Array.isArray(schema);
    expect(actual).toBe(true);

    if (!Array.isArray(schema)) {
      throw new TypeError(`${name} declares a schema that is not an array`);
    }

    const open = schema
      .filter((entry) => {
        return entry.type === 'object' && entry.additionalProperties !== false;
      });

    expect(open).toEqual([]);
  });
});

describe('rule metadata', () => {
  const expected = readJson('__mocks__/ruleMetadata.json');

  it('covers exactly the registered rules', () => {
    const expectedIds = Object.keys(expected)
      .toSorted(alphabetically);

    expect(expectedIds).toEqual(ruleNames.toSorted(alphabetically));
  });

  it.each(ruleCases)('matches the recorded surface for "%s"', (name, rule) => {
    const actual = {
      messages: rule.meta.messages,
      schema: rule.meta.schema,
      type: rule.meta.type,
      fixable: rule.meta.fixable ?? null,
      docs: {
        fixShape: rule.meta.docs.fixShape ?? null,
        language: rule.meta.docs.language,
        recommended: rule.meta.docs.recommended,
        requiresTypeChecking: rule.meta.docs.requiresTypeChecking ?? false,
        description: rule.meta.docs.description,
      },
    };
    expect(actual).toEqual(expected[name]);
  });
});

describe('configs', () => {
  const allPresets = PRESET_NAMES
    .map((name) => {
      const entry = [name, configs[`flat/${name}`]] as const;

      return entry;
    });

  it('exposes both shapes of every preset and nothing else', () => {
    const configNames = Object.keys(configs)
      .toSorted(alphabetically);

    const flatNames = PRESET_NAMES
      .map((name) => {
        return `flat/${name}`;
      });
    const shipped = [...PRESET_NAMES, ...flatNames];
    const presetNames = shipped.toSorted(alphabetically);

    expect(configNames).toEqual(presetNames);

    for (const [, preset] of allPresets) {
      const actual = Array.isArray(preset);
      expect(actual).toBe(true);
      expect(preset.length).toBeGreaterThan(0);
    }
  });

  it('keeps the bare names as eslintrc objects, not flat arrays', () => {
    for (const name of PRESET_NAMES) {
      const preset = configs[name];

      const actual = Array.isArray(preset);
      expect(actual).toBe(false);
      const expected = [PLUGIN_NAME];
      expect(preset.plugins).toEqual(expected);

      const enabled = Object.keys(preset.rules).length + preset.overrides
        .reduce((total, override) => {
          return total + Object.keys(override.rules).length;
        }, 0);

      expect(enabled).toBeGreaterThan(0);
    }
  });

  it('puts the TypeScript-only rules behind an eslintrc override', () => {
    const [override] = configs.recommended.overrides;

    const expected = [...TYPESCRIPT_FILES];
    expect(override?.files).toEqual(expected);
    expect(Object.keys(override?.rules ?? {}).length).toBeGreaterThan(0);
  });

  it('names every flat block after the preset it came from, universal first', () => {
    for (const name of PRESET_NAMES) {
      const blocks = configs[`flat/${name}`];
      const expected = [`${PLUGIN_NAME}/${name}`, `${PLUGIN_NAME}/${name}/typescript`];

      const blockNames = blocks
        .map((block) => {
          return block.name;
        });

      expect(blockNames).toEqual(expected.slice(0, blocks.length));
    }
  });

  it('carries an eslintrc override exactly where the flat preset carries a second block', () => {
    const anyTwo = PRESET_NAMES
      .some((name) => {
        return configs[`flat/${name}`].length === 2;
      });

    expect(anyTwo).toBe(true);

    for (const name of PRESET_NAMES) {
      expect(configs[name].overrides).toHaveLength(configs[`flat/${name}`].length - 1);
    }
  });

  it('carries the rules and the presets on the default export, as the same objects', () => {
    expect(plugin.configs).toBe(configs);
    expect(plugin.rules).toBe(rules);
  });

  it('enables exactly the recommended rules in recommended', () => {
    const enabled = enabledIn(configs['flat/recommended']);
    expect(enabled).toEqual(prefixed(recommendedNames));
  });

  it('carries every rule in all', () => {
    const enabled = enabledIn(configs['flat/all']);
    expect(enabled).toEqual(prefixed(ruleNames));
  });

  it('registers the plugin once per preset, on the unscoped block', () => {
    for (const [, preset] of allPresets) {
      const [base, ...rest] = preset;

      const actual = Object.keys(base?.plugins ?? {});
      const expected = [PLUGIN_NAME];
      expect(actual).toEqual(expected);

      for (const block of rest) {
        expect(block.plugins).toBeUndefined();
      }
    }
  });

  it('sets every rule to error', () => {
    for (const [, preset] of allPresets) {
      for (const config of preset) {
        for (const severity of Object.values(config.rules ?? {})) {
          expect(severity).toBe('error');
        }
      }
    }
  });

  it('puts TypeScript-only rules behind a files glob and nothing else', () => {
    const misplaced = allPresets
      .flatMap(([, preset]) => {
        return preset;
      })
      .filter((config) => {
        const ruleIds = Object.keys(config.rules ?? {});
        const languages = new Set(languagesOf(ruleIds));

        return config.files
          ? languages.size !== 1 || !languages.has('typescript')
          : languages.has('typescript');
      })
      .map((config) => {
        return config.name;
      });

    expect(misplaced).toEqual([]);
  });

  it('scopes those blocks to the TypeScript extensions and nothing else', () => {
    const globs = allPresets
      .flatMap(([, preset]) => {
        return preset;
      })
      .flatMap((config) => {
        return config.files ?? [];
      });

    const actual = [...new Set(globs)];
    const expected = [...TYPESCRIPT_FILES];
    expect(actual).toEqual(expected);
  });
});

describe('language scoping, resolved by eslint', () => {
  const typescriptOnly = ruleCases
    .filter(([, rule]) => {
      return rule.meta.docs.language === 'typescript';
    })
    .map(([name]) => {
      return `${PLUGIN_NAME}/${name}`;
    });

  const ruleIdsIn = (resolved: unknown): string[] => {
    if (resolved === null || typeof resolved !== 'object' || !('rules' in resolved)) {
      return [];
    }

    const { rules: resolvedRules } = resolved;

    if (resolvedRules === null || typeof resolvedRules !== 'object') {
      return [];
    }

    return Object.keys(resolvedRules);
  };

  const resolve = async (filename: string): Promise<string[]> => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: configs['flat/recommended'],
    });

    const resolved: unknown = await eslint.calculateConfigForFile(filename);

    return ruleIdsIn(resolved)
      .filter((id) => {
        return id.startsWith(`${PLUGIN_NAME}/`);
      })
      .toSorted(alphabetically);
  };

  it('has at least one TypeScript-only rule to prove the split with', () => {
    expect(typescriptOnly.length).toBeGreaterThan(0);
  });

  it('leaves TypeScript-only rules off in a .js file', async () => {
    const enabled = await resolve('example.js');

    for (const id of typescriptOnly) {
      expect(enabled).not.toContain(id);
    }

    const recommendedTypescriptOnly = typescriptOnly
      .filter((id) => {
        const ruleName = id.slice(PLUGIN_NAME.length + 1);

        return recommendedNames.includes(ruleName);
      });
    expect(enabled).toHaveLength(recommendedNames.length - recommendedTypescriptOnly.length);
  });

  it.each([
    'example.ts',
    'example.tsx',
    'example.mts',
    'example.cts',
  ])(
    'turns every recommended rule on in %s',
    async (filename: string) => {
      const actual = await resolve(filename);
      expect(actual).toEqual(prefixed(recommendedNames));
    },
  );
});

const tableRows = (readme: string): string[] => {
  const matches = [...readme.matchAll(/^\| \[`@linteljs\/([a-z][a-z0-9-]*)`\]/gm)];

  return matches
    .flatMap((match) => {
      return match[1] ?? [];
    });
};

describe('documentation', () => {
  it.each(ruleCases)('documents "%s" with its description and examples', (name, rule) => {
    const doc = readFileSync(join(rulesDir, name, 'README.md'), 'utf8');

    expect(doc).toContain(rule.meta.docs.description);
    expect(doc).toMatch(/```/);
    expect(doc).not.toMatch(/[—–]/);
  });

  it.each(ruleCases)('documents every option "%s" actually accepts', (name, rule) => {
    const optionNames = (Array.isArray(rule.meta.schema) ? rule.meta.schema : [])
      .flatMap((entry) => {
        return Object.keys(entry.properties ?? {});
      });
    const doc = readFileSync(join(rulesDir, name, 'README.md'), 'utf8');

    const missingNone = [/## Options\s+None\./.test(doc) ? '' : '## Options None.'];
    const undocumented = optionNames.length === 0
      ? missingNone
      : optionNames
          .map((option) => {
            return doc.includes(`\`${option}\``) ? '' : option;
          });

    const filtered = undocumented.filter(Boolean);
    expect(filtered).toEqual([]);
  });

  it.each(ruleCases)('restates "%s" metadata the way meta declares it', (name, rule) => {
    const doc = readFileSync(join(rulesDir, name, 'README.md'), 'utf8');
    const { language, recommended } = rule.meta.docs;
    const fixable = rule.meta.fixable === undefined ? 'no' : `yes (${rule.meta.fixable})`;
    const bullets = [
      `- Applies to: ${language === 'typescript' ? 'TypeScript only' : 'JavaScript and TypeScript'}`,
      `- Fixable: ${fixable}`,
      `- In \`recommended\`: ${recommended ? 'yes' : 'no'}`,
    ];

    expect(doc.split('\n')[0]).toBe(`# ${PLUGIN_NAME}/${name}`);

    const undocumented = bullets
      .filter((bullet) => {
        return !doc.includes(bullet);
      });

    expect(undocumented).toEqual([]);
  });

  it('lists every rule in the README table once, in rule id order', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    const actual = tableRows(readme);
    expect(actual).toEqual(ruleNames.toSorted(alphabetically));
  });

  it('names no preset outside the two the plugin ships, in any of its docs', () => {
    const presets: string[] = [...PRESET_NAMES];
    const rootReadme = join(root, 'README.md');
    const linked = ruleNames
      .map((name) => {
        return join(rulesDir, name, 'README.md');
      })
      .concat(rootReadme)
      .flatMap((path) => {
        const text = readFileSync(path, 'utf8');
        const matches = [...text.matchAll(/\bflat\/([a-z][a-z-]*)/g)];

        return matches
          .flatMap((match) => {
            return match[1] ?? [];
          });
      });

    const named = [...new Set(linked)];

    const unknownPresets = named
      .filter((preset) => {
        return !presets.includes(preset);
      });

    expect(unknownPresets).toEqual([]);
  });

  it('keeps the README free of em-dashes', () => {
    const file = readFileSync(join(root, 'README.md'), 'utf8');
    expect(file).not.toMatch(/[—–]/);
  });
});
