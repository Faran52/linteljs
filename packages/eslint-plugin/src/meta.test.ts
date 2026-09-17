import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { ESLint, type Linter } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import plugin, {
  configs,
  PLUGIN_NAME,
  rules,
} from './index';
import {
  docsUrl,
  type LintelRuleModule,
  RULE_CATEGORIES,
  RULE_LANGUAGES,
  type RuleCategory,
  type RuleLanguage,
  TYPESCRIPT_FILES,
} from './types';

const root = join(import.meta.dirname, '..');
const rulesDir = join(root, 'src', 'rules');

// Read off disk rather than probed, so a directory the registry never exports is caught too.
const ruleDirectories = readdirSync(rulesDir, { withFileTypes: true }).filter((entry) => {
  return entry.isDirectory();
}).map((entry) => {
  return entry.name;
});

const filesIn = (ruleName: string): string[] => {
  return readdirSync(join(rulesDir, ruleName));
};

// Every module a rule owns, its own and the private helpers under `utils/`, as paths relative to the rule directory.
const modulesIn = (ruleName: string): string[] => {
  return readdirSync(join(rulesDir, ruleName), {
    withFileTypes: true,
    recursive: true,
  }).filter((entry) => {
    return entry.isFile() && entry.name.endsWith('.ts');
  }).map((entry) => {
    return relative(join(rulesDir, ruleName), join(entry.parentPath, entry.name));
  });
};

// The implementation file is named for its single export, so the directory name is the only place the rule id
// appears. `index` is a barrel in this repo and a rule directory is not one.
const moduleNameOf = (ruleName: string): string => {
  return ruleName.replace(/-([a-z])/g, (_match, letter: string) => {
    return letter.toUpperCase();
  });
};

// What every rule directory owes: the rule, its suite, and the page GitHub renders via `meta.docs.url`.
const requiredFiles = (ruleName: string): string[] => {
  const module = moduleNameOf(ruleName);

  return [`${module}.ts`, `${module}.test.ts`, 'README.md'];
};

const readJson = (path: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(readFileSync(join(root, path), 'utf8'));

  if (typeof parsed !== 'object' || parsed === null) {
    throw new TypeError(`${path} is not an object`);
  }

  return { ...parsed };
};

// `import()` on a computed path returns `any`, so the namespace is bound `unknown` and narrowed
// by this guard, not a generic helper.
const isNamespace = (loaded: unknown): loaded is object => {
  return typeof loaded === 'object' && loaded !== null;
};

const isRuleModule = (value: unknown): value is LintelRuleModule => {
  return typeof value === 'object'
    && value !== null
    && 'create' in value
    && typeof value.create === 'function';
};

// Bare `sort()` orders by UTF-16 and mutates the receiver; `toSorted` with `localeCompare` avoids
// rewriting an array every other test reads.
const alphabetically = (values: string[]): string[] => {
  return values.toSorted((left, right) => {
    return left.localeCompare(right);
  });
};

const enabledIn = (preset: Linter.Config[]): string[] => {
  return alphabetically(preset.flatMap((config) => {
    return Object.keys(config.rules ?? {});
  }));
};

const PRESET_NAMES = ['recommended', ...RULE_CATEGORIES] as const;

const recommendedNames = Object.entries(rules).filter(([, rule]) => {
  return rule.meta.docs.recommended;
}).map(([name]) => {
  return name;
});

const packageJson = readJson('package.json');
const ruleNames = Object.keys(rules);
const ruleCases: [string, LintelRuleModule][] = Object.entries(rules);
const prefixed = (names: string[]): string[] => {
  return alphabetically(names.map((name) => {
    return `${PLUGIN_NAME}/${name}`;
  }));
};

// Reads the registry forwards rather than slicing the prefix off each id and looking it up, which would need a cast.
const languagesOf = (ids: string[]): RuleLanguage[] => {
  const enabled = new Set(ids);

  return ruleCases.filter(([name]) => {
    return enabled.has(`${PLUGIN_NAME}/${name}`);
  }).map(([, rule]) => {
    return rule.meta.docs.language;
  });
};

describe('plugin shape', () => {
  it('registers at least one rule', () => {
    expect(ruleNames.length).toBeGreaterThan(0);
  });

  it('reports a version matching package.json', () => {
    expect(plugin.meta?.version).toBe(packageJson['version']);
  });

  it('reports a name matching package.json', () => {
    expect(plugin.meta?.name).toBe(packageJson['name']);
  });

  it('declares no runtime dependencies', () => {
    expect(packageJson['dependencies']).toBeUndefined();
  });

  it('exposes rules on the default export', () => {
    expect(plugin.rules).toBe(rules);
  });

  // toEqual on both sorted lists catches a rule with no directory and a directory nothing registers.
  it('registers exactly the rules that have a directory', () => {
    expect(alphabetically(ruleDirectories)).toEqual(alphabetically(ruleNames));
  });
});

describe.each(ruleCases)('rule "%s"', (name, rule) => {
  const { meta } = rule;

  it('uses a kebab-case id', () => {
    expect(name).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
  });

  it('declares a description written as a sentence', () => {
    expect(meta.docs.description.length).toBeGreaterThan(10);
    expect(meta.docs.description).toMatch(/\.$/);
  });

  it('declares a known category', () => {
    expect(RULE_CATEGORIES).toContain(meta.docs.category);
  });

  it('declares a known language', () => {
    expect(RULE_LANGUAGES).toContain(meta.docs.language);
  });

  it('declares whether recommended enables it', () => {
    expect(typeof meta.docs.recommended).toBe('boolean');
  });

  it('derives its docs url from its id', () => {
    expect(meta.docs.url).toBe(docsUrl(name));
  });

  it('keeps its rule, its suite and its doc in its own directory', () => {
    const present = filesIn(name);

    expect(requiredFiles(name).filter((file) => {
      return !present.includes(file);
    })).toEqual([]);
  });

  // The directory is the one place the kebab-case id is written, so a rename that missed one half shows up here.
  it('names its module for its single export, not index', () => {
    expect(filesIn(name)).not.toContain('index.ts');
    expect(Object.keys(rule)).toContain('create');
  });

  // Complements the required-files check: a stray file could sit here forever otherwise. A private helper belongs
  // under `utils/`, where the root config's `**/utils/*.ts` naming map enforces the `*Utils` suffix on it.
  it('holds nothing beside them but a utils directory', () => {
    const strays = filesIn(name).filter((file) => {
      return !requiredFiles(name).includes(file) && file !== 'utils';
    });

    expect(strays).toEqual([]);
  });

  it('suffixes every private helper and puts it under utils', () => {
    const misplaced = modulesIn(name).filter((file) => {
      return !requiredFiles(name).includes(file)
        && !/^utils\/[a-z][A-Za-z]*Utils(\.test)?\.ts$/.test(file);
    });

    expect(misplaced).toEqual([]);
  });

  it('declares a valid rule type', () => {
    expect(['problem', 'suggestion', 'layout']).toContain(meta.type);
  });

  it('declares at least one message', () => {
    expect(Object.keys(meta.messages ?? {}).length).toBeGreaterThan(0);
  });

  // Rule messages and descriptions are read by strangers in their editor, so they follow the README's house style.
  it('writes messages without em-dashes', () => {
    for (const message of Object.values(meta.messages ?? {})) {
      expect(message).not.toMatch(/[—–]/);
    }

    expect(meta.docs.description).not.toMatch(/[—–]/);
  });

  it('declares a schema', () => {
    expect(meta.schema).toBeDefined();
  });

  // Without `additionalProperties: false`, a typo in a consumer's config is silently accepted and never takes effect.
  it('rejects unknown options in every object schema', () => {
    // Asserted rather than returned-early, so a rule that switched to the object schema form is
    // caught, not silently skipped.
    const { schema } = meta;

    expect(Array.isArray(schema)).toBe(true);

    // Thrown rather than asserted, since `expect` narrows nothing for the compiler.
    if (!Array.isArray(schema)) {
      throw new TypeError(`${name} declares a schema that is not an array`);
    }

    // Collected rather than asserted inside the `if`, since a conditional `expect` passes
    // silently when the branch never runs.
    expect(schema.filter((entry) => {
      return entry.type === 'object' && entry.additionalProperties !== false;
    })).toEqual([]);
  });

  it('marks itself fixable when it provides a fix', () => {
    // Reads every non-test module, not just the rule's own, since a fixer may live in `utils/writeUtils.ts`.
    const source = modulesIn(name).filter((file) => {
      return !file.endsWith('.test.ts');
    }).map((file) => {
      return readFileSync(join(rulesDir, name, file), 'utf8');
    }).join('\n');

    const providesFix = /\bfix[:(*]|\* fix\(/.test(source);

    expect(providesFix && meta.fixable === undefined ? [name] : []).toEqual([]);
  });
});

// Resolves each rule through its id rather than trusting the registry's own import path. Cannot catch a rule
// that throws while its module evaluates, since this file imports `./index` too; `ruleModules.test.ts` covers it.
describe('rule modules load', () => {
  it.each(ruleNames)('%s builds a usable rule at import time', async (name) => {
    const loaded: unknown = await import(`./rules/${name}/${moduleNameOf(name)}.ts`);
    const rule = isNamespace(loaded) ? Object.values(loaded).find(isRuleModule) : undefined;

    if (!rule) {
      throw new Error(`${name}/index.ts exports no rule`);
    }

    expect(rule.meta.docs.description).toBeTruthy();
  });
});

// Pins each rule's published surface against a checked-in copy, since the rule suites assert
// `messageId` and never see a typo in the text or a loosened schema.
describe('rule metadata', () => {
  const expected = readJson('__mocks__/ruleMetadata.json');

  it('covers exactly the registered rules', () => {
    expect(alphabetically(Object.keys(expected))).toEqual(alphabetically(ruleNames));
  });

  it.each(ruleCases)('matches the recorded surface for "%s"', (name, rule) => {
    expect({
      messages: rule.meta.messages,
      schema: rule.meta.schema,
      type: rule.meta.type,
      fixable: rule.meta.fixable ?? null,
      docs: {
        category: rule.meta.docs.category,
        language: rule.meta.docs.language,
        recommended: rule.meta.docs.recommended,
        description: rule.meta.docs.description,
      },
    }).toEqual(expected[name]);
  });
});

describe('configs', () => {
  const allPresets = PRESET_NAMES.map((name) => {
    return [name, configs[`flat/${name}`]] as const;
  });

  // Pins the preset key set exhaustively, so an added or removed key shows up here rather than
  // as a shape nobody notices until a consumer spreads it.
  it('exposes both shapes of every preset and nothing else', () => {
    expect(alphabetically(Object.keys(configs))).toEqual(alphabetically([
      ...PRESET_NAMES,
      ...PRESET_NAMES.map((name) => {
        return `flat/${name}`;
      }),
    ]));

    for (const [, preset] of allPresets) {
      expect(Array.isArray(preset)).toBe(true);
      expect(preset.length).toBeGreaterThan(0);
    }
  });

  // The bare names must stay eslintrc objects, since `eslint` >=5.0.0 consumers spread them; an
  // array there throws somewhere else entirely.
  it('keeps the bare names as eslintrc objects, not flat arrays', () => {
    for (const name of PRESET_NAMES) {
      const preset = configs[name];

      expect(Array.isArray(preset)).toBe(false);
      expect(preset.plugins).toEqual([PLUGIN_NAME]);
      expect(Object.keys(preset.rules).length).toBeGreaterThan(0);
    }
  });

  it('puts the TypeScript-only rules behind an eslintrc override', () => {
    const [override] = configs.recommended.overrides;

    expect(override?.files).toEqual([...TYPESCRIPT_FILES]);
    expect(Object.keys(override?.rules ?? {}).length).toBeGreaterThan(0);
  });

  // `name` is what ESLint prints when tracing a rule to its config (`--print-config`, a config error's "defined
  // by" line). Order is pinned too: the universal block comes first and carries the plugin registration.
  it('names every flat block after the preset it came from, universal first', () => {
    for (const name of PRESET_NAMES) {
      const blocks = configs[`flat/${name}`];
      const expected = [`${PLUGIN_NAME}/${name}`, `${PLUGIN_NAME}/${name}/typescript`];

      expect(blocks.map((block) => {
        return block.name;
      })).toEqual(expected.slice(0, blocks.length));
    }
  });

  // `overrides` exists only when a preset has a TypeScript-only rule to scope; the empty arm matters too, an override
  // enabling nothing is unexplainable. Keyed off the flat twin's block count, not a second list naming them.
  it('carries an eslintrc override exactly where the flat preset carries a second block', () => {
    // Guards against the loop below passing vacuously for a reason unrelated to overrides.
    expect(PRESET_NAMES.some((name) => {
      return configs[`flat/${name}`].length === 1;
    })).toBe(true);

    for (const name of PRESET_NAMES) {
      expect(configs[name].overrides).toHaveLength(configs[`flat/${name}`].length - 1);
    }
  });

  // `configs` must be reachable off the default export as the *same* object: ESLint compares plugins by identity,
  // and a copy throws "Cannot redefine plugin" the first time a consumer wants the preset plus one rule.
  it('carries the rules and the presets on the default export, as the same objects', () => {
    expect(plugin.configs).toBe(configs);
    expect(plugin.rules).toBe(rules);
  });

  it('enables exactly the recommended rules in recommended', () => {
    expect(enabledIn(configs['flat/recommended'])).toEqual(prefixed(recommendedNames));
  });

  // An opt-out rule still needs a path in, or excluding it from `recommended` ships it permanently off.
  it('keeps every opt-out rule reachable through its category preset', () => {
    const optOut = ruleCases.filter(([, rule]) => {
      return !rule.meta.docs.recommended;
    });

    expect(optOut.length).toBeGreaterThan(0);

    for (const [name, rule] of optOut) {
      expect(enabledIn(configs[`flat/${rule.meta.docs.category}`])).toContain(`${PLUGIN_NAME}/${name}`);
    }
  });

  it.each(RULE_CATEGORIES)('scopes %s to its category', (category: RuleCategory) => {
    const expected = prefixed(
      ruleCases.filter(([, rule]) => {
        return rule.meta.docs.category === category;
      }).map(([name]) => {
        return name;
      }),
    );

    expect(enabledIn(configs[`flat/${category}`])).toEqual(expected);
    expect(expected.length).toBeGreaterThan(0);
  });

  it('covers every rule across the category presets exactly once', () => {
    const seen = RULE_CATEGORIES.flatMap((category) => {
      return enabledIn(configs[`flat/${category}`]);
    });

    expect(alphabetically(seen)).toEqual(alphabetically([...new Set(seen)]));
    expect(seen).toHaveLength(ruleNames.length);
  });

  it('registers the plugin once per preset, on the unscoped block', () => {
    for (const [, preset] of allPresets) {
      const [base, ...rest] = preset;

      // Optional on the read rather than guarded first, so an empty preset fails this assertion
      // instead of skipping it silently.
      expect(Object.keys(base?.plugins ?? {})).toEqual([PLUGIN_NAME]);

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
    // One assertion over every block, since an `expect` inside a branch reports nothing when that branch never runs.
    const misplaced = allPresets.flatMap(([, preset]) => {
      return preset;
    }).filter((config) => {
      const languages = [...new Set(languagesOf(Object.keys(config.rules ?? {})))];

      return config.files
        ? languages.length !== 1 || languages[0] !== 'typescript'
        : languages.includes('typescript');
    }).map((config) => {
      return config.name;
    });

    expect(misplaced).toEqual([]);
  });

  // Checks the glob's contents, not just its presence, since `**/*.ts` alone would pass while
  // leaving a rule off in `.tsx`.
  it('scopes those blocks to the TypeScript extensions and nothing else', () => {
    const globs = allPresets.flatMap(([, preset]) => {
      return preset;
    }).flatMap((config) => {
      return config.files ?? [];
    });

    expect([...new Set(globs)]).toEqual([...TYPESCRIPT_FILES]);
  });
});

// Asserts on ESLint's own resolved config, not our data structure, since what matters is what a file actually gets.
describe('language scoping, resolved by eslint', () => {
  const typescriptOnly = ruleCases.filter(([, rule]) => {
    return rule.meta.docs.language === 'typescript';
  }).map(([name]) => {
    return `${PLUGIN_NAME}/${name}`;
  });

  // `calculateConfigForFile` returns `any`, so ids are read out through this guard rather than
  // spread untyped into the assertions.
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

    return alphabetically(ruleIdsIn(await eslint.calculateConfigForFile(filename)).filter((id) => {
      return id.startsWith(`${PLUGIN_NAME}/`);
    }));
  };

  it('has at least one TypeScript-only rule to prove the split with', () => {
    expect(typescriptOnly.length).toBeGreaterThan(0);
  });

  it('leaves TypeScript-only rules off in a .js file', async () => {
    const enabled = await resolve('example.js');

    for (const id of typescriptOnly) {
      expect(enabled).not.toContain(id);
    }

    expect(enabled).toHaveLength(recommendedNames.length - typescriptOnly.filter((id) => {
      return recommendedNames.includes(id.slice(PLUGIN_NAME.length + 1));
    }).length);
  });

  it.each(['example.ts', 'example.tsx', 'example.mts', 'example.cts'])(
    'turns every recommended rule on in %s',
    async (filename: string) => {
      expect(await resolve(filename)).toEqual(prefixed(recommendedNames));
    },
  );
});

describe('documentation', () => {
  it.each(ruleCases)('documents "%s" with its description and examples', (name, rule) => {
    const doc = readFileSync(join(rulesDir, name, 'README.md'), 'utf8');

    expect(doc).toContain(rule.meta.docs.description);
    expect(doc).toMatch(/```/);
    expect(doc).not.toMatch(/[—–]/);
  });

  // Cross-checked against the schema rather than proof-read, so a configurable rule documented as fixed gets caught.
  it.each(ruleCases)('documents every option "%s" actually accepts', (name, rule) => {
    // flatMap over every schema entry; a rule with no schema contributes nothing, landing it on
    // the "## Options None." branch below.
    const optionNames = (Array.isArray(rule.meta.schema) ? rule.meta.schema : []).flatMap((entry) => {
      return Object.keys(entry.properties ?? {});
    });
    const doc = readFileSync(join(rulesDir, name, 'README.md'), 'utf8');

    // Both halves fold into one unconditional assertion, so neither branch can be skipped silently.
    const undocumented = optionNames.length === 0
      ? [/## Options\s+None\./.test(doc) ? '' : '## Options None.']
      : optionNames.map((option) => {
          return doc.includes(`\`${option}\``) ? '' : option;
        });

    expect(undocumented.filter(Boolean)).toEqual([]);
  });

  it('lists every rule in the README table', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');

    for (const name of ruleNames) {
      expect(readme).toContain(`\`${PLUGIN_NAME}/${name}\``);
    }
  });

  it('keeps the README free of em-dashes', () => {
    expect(readFileSync(join(root, 'README.md'), 'utf8')).not.toMatch(/[—–]/);
  });
});
