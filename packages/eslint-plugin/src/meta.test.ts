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

// Every file a rule directory holds, `utils/` included, as paths relative to it.
const filesIn = (ruleName: string): string[] => {
  return readdirSync(join(rulesDir, ruleName), {
    withFileTypes: true,
    recursive: true,
  })
    .filter((entry) => {
      return entry.isFile();
    })
    .map((entry) => {
      return relative(join(rulesDir, ruleName), join(entry.parentPath, entry.name));
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

// `toSorted` rather than `sort()`, which would rewrite an array every other test reads.
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

// Reads the registry forwards rather than slicing the prefix off each id and looking it up, which would need a cast.
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

  /**
   * Only a rule with a fixer may say what its fixer does, and `fixerSafety.test.ts` is what holds it to the claim.
   * A rule declaring nothing may rewrite code, which is what `prefer-arrow-functions` does.
   */
  it('declares a fix shape only where there is a fixer to shape', () => {
    const { fixShape } = meta.docs;

    // Absent is legal for every rule; a value is legal only where there is a fixer for it to describe.
    expect([...FIX_SHAPES, undefined]).toContain(fixShape);
    expect(fixShape === undefined || meta.fixable !== undefined).toBe(true);
  });

  it('derives its docs url from its id', () => {
    expect(meta.docs.url).toBe(docsUrl(name));
  });

  // Equality both ways: a missing README fails, and so do a leftover `index.ts`, half a rename and a helper outside
  // `utils/`. The `*Utils` suffix inside it is the root config's `**/utils/*.ts` naming map, so it is not repeated.
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
    const open = schema
      .filter((entry) => {
        return entry.type === 'object' && entry.additionalProperties !== false;
      });

    expect(open).toEqual([]);
  });
});

// Pins each rule's published surface against a checked-in copy, since the rule suites assert
// `messageId` and never see a typo in the text or a loosened schema.
describe('rule metadata', () => {
  const expected = readJson('__mocks__/ruleMetadata.json');

  it('covers exactly the registered rules', () => {
    const expectedIds = Object.keys(expected)
      .toSorted(alphabetically);

    expect(expectedIds).toEqual(ruleNames.toSorted(alphabetically));
  });

  it.each(ruleCases)('matches the recorded surface for "%s"', (name, rule) => {
    expect({
      messages: rule.meta.messages,
      schema: rule.meta.schema,
      type: rule.meta.type,
      fixable: rule.meta.fixable ?? null,
      docs: {
        fixShape: rule.meta.docs.fixShape ?? null,
        language: rule.meta.docs.language,
        recommended: rule.meta.docs.recommended,
        description: rule.meta.docs.description,
      },
    }).toEqual(expected[name]);
  });
});

describe('configs', () => {
  const allPresets = PRESET_NAMES
    .map((name) => {
      return [name, configs[`flat/${name}`]] as const;
    });

  // Pins the preset key set exhaustively, so an added or removed key shows up here rather than
  // as a shape nobody notices until a consumer spreads it.
  it('exposes both shapes of every preset and nothing else', () => {
    const configNames = Object.keys(configs)
      .toSorted(alphabetically);

    const presetNames = [
      ...PRESET_NAMES,
      ...PRESET_NAMES
        .map((name) => {
          return `flat/${name}`;
        }),
    ].toSorted(alphabetically);

    expect(configNames).toEqual(presetNames);

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

      /**
       * Both halves, because a preset can be entirely TypeScript-only and then carries nothing in `rules`. The
       * property under test is that a preset enables something, not where it enables it.
       */
      const enabled = Object.keys(preset.rules).length + preset.overrides
        .reduce((total, override) => {
          return total + Object.keys(override.rules).length;
        }, 0);

      expect(enabled).toBeGreaterThan(0);
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

      const blockNames = blocks
        .map((block) => {
          return block.name;
        });

      expect(blockNames).toEqual(expected.slice(0, blocks.length));
    }
  });

  // `overrides` exists only when a preset has a TypeScript-only rule to scope; the empty arm matters too, an override
  // enabling nothing is unexplainable. Keyed off the flat twin's block count, not a second list naming them.
  it('carries an eslintrc override exactly where the flat preset carries a second block', () => {
    // Guards against the loop below passing vacuously: some preset has to carry a TypeScript-only block at all.
    const anyTwo = PRESET_NAMES
      .some((name) => {
        return configs[`flat/${name}`].length === 2;
      });

    expect(anyTwo).toBe(true);

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
  it('carries every rule in all', () => {
    expect(enabledIn(configs['flat/all'])).toEqual(prefixed(ruleNames));
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
    const misplaced = allPresets
      .flatMap(([, preset]) => {
        return preset;
      })
      .filter((config) => {
        const languages = [...new Set(languagesOf(Object.keys(config.rules ?? {})))];

        return config.files
          ? languages.length !== 1 || languages[0] !== 'typescript'
          : languages.includes('typescript');
      })
      .map((config) => {
        return config.name;
      });

    expect(misplaced).toEqual([]);
  });

  // Checks the glob's contents, not just its presence, since `**/*.ts` alone would pass while
  // leaving a rule off in `.tsx`.
  it('scopes those blocks to the TypeScript extensions and nothing else', () => {
    const globs = allPresets
      .flatMap(([, preset]) => {
        return preset;
      })
      .flatMap((config) => {
        return config.files ?? [];
      });

    expect([...new Set(globs)]).toEqual([...TYPESCRIPT_FILES]);
  });
});

// Asserts on ESLint's own resolved config, not our data structure, since what matters is what a file actually gets.
describe('language scoping, resolved by eslint', () => {
  const typescriptOnly = ruleCases
    .filter(([, rule]) => {
      return rule.meta.docs.language === 'typescript';
    })
    .map(([name]) => {
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

    return ruleIdsIn(await eslint.calculateConfigForFile(filename))
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

    expect(enabled).toHaveLength(recommendedNames.length - typescriptOnly
      .filter((id) => {
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

// The rule ids the hand-edited README table names, in the order it names them. A row opens with the
// id as a linked code span, which nothing else in the file does.
const tableRows = (readme: string): string[] => {
  return [...readme.matchAll(/^\| \[`@linteljs\/([a-z][a-z0-9-]*)`\]/gm)]
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

  // Cross-checked against the schema rather than proof-read, so a configurable rule documented as fixed gets caught.
  it.each(ruleCases)('documents every option "%s" actually accepts', (name, rule) => {
    // flatMap over every schema entry; a rule with no schema contributes nothing, landing it on
    // the "## Options None." branch below.
    const optionNames = (Array.isArray(rule.meta.schema) ? rule.meta.schema : [])
      .flatMap((entry) => {
        return Object.keys(entry.properties ?? {});
      });
    const doc = readFileSync(join(rulesDir, name, 'README.md'), 'utf8');

    // Both halves fold into one unconditional assertion, so neither branch can be skipped silently.
    const undocumented = optionNames.length === 0
      ? [/## Options\s+None\./.test(doc) ? '' : '## Options None.']
      : optionNames
          .map((option) => {
            return doc.includes(`\`${option}\``) ? '' : option;
          });

    expect(undocumented.filter(Boolean)).toEqual([]);
  });

  // The bullet block under each title is prose restating `meta`, and nothing compared the two: `member-newline`
  // shipped `- Fixable: yes (whitespace)` against a `code` fixer while every other check passed. A bullet may carry a
  // qualifier after its value, as `yes (code), except the hoisted case` does, so each is matched as a prefix.
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

  // Equality, not containment: `react-no-global-namespace` once shipped two rows and a containment check passed it.
  // A table nobody generates also drifts out of order one edit at a time.
  it('lists every rule in the README table once, in rule id order', () => {
    expect(tableRows(readFileSync(join(root, 'README.md'), 'utf8'))).toEqual(ruleNames.toSorted(alphabetically));
  });

  /**
   * Every page in the package, not just the root README: `scripts/build/rule-docs/ruleDocsBuild.ts` publishes each
   * rule's own README under `docs/`, so a stale preset name there ships too.
   */
  it('names no preset outside the two the plugin ships, in any of its docs', () => {
    const presets: string[] = [...PRESET_NAMES];
    const linked = ruleNames
      .map((name) => {
        return join(rulesDir, name, 'README.md');
      })
      .concat(join(root, 'README.md'))
      .flatMap((path) => {
        return [...readFileSync(path, 'utf8').matchAll(/\bflat\/([a-z][a-z-]*)/g)]
          .flatMap((match) => {
            return match[1] ?? [];
          });
      });

    const named = new Set(linked);

    const unknownPresets = [...named]
      .filter((preset) => {
        return !presets.includes(preset);
      });

    expect(unknownPresets).toEqual([]);
  });

  it('keeps the README free of em-dashes', () => {
    expect(readFileSync(join(root, 'README.md'), 'utf8')).not.toMatch(/[—–]/);
  });
});
