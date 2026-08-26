import {
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  AGENTS,
  type Answers,
  DEFAULT_ANSWERS,
  LIBRARIES,
  PACKAGE_MANAGERS,
  PLUGINS,
  SURFACES,
  surfacesOf,
  TARGET_IDS,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../answers/answers';

import {
  CONFIG_PATH,
  CONFIG_SCHEMA_URL,
  CURRENT_SCHEMA_VERSION,
  emitLintelConfig,
  parseLintelConfig,
  readLintelConfig,
} from './lintelConfig';

interface ConfigOverrides {
  $schema?: string;
  target?: string | undefined;
  testing?: string;
  packageManager?: string;
  libraries?: string | string[];
  store?: boolean | string;
  typeSafety?: string;
  agents?: string | string[];
  plugins?: string | (string | number)[];
  unexpected?: boolean | object;
  // An answer this version does not have, which is the shape a config written before it was dropped still carries.
  typescript?: boolean;
}

interface SchemaNode {
  constant?: number;
  choices?: string[];
  items?: SchemaNode;
}

interface LintelConfigSchema {
  $id: string;
  properties: {
    schemaVersion: SchemaNode;
    target: SchemaNode;
    testing: SchemaNode;
    packageManager: SchemaNode;
    libraries: SchemaNode;
    typeSafety: SchemaNode;
    agents: SchemaNode;
    plugins: SchemaNode;
    surfaces: SchemaNode;
  };
}

type SchemaValue = string | number | boolean | string[] | SchemaFields;

interface SchemaFields {
  $id?: SchemaValue;
  properties?: SchemaValue;
  schemaVersion?: SchemaValue;
  target?: SchemaValue;
  testing?: SchemaValue;
  packageManager?: SchemaValue;
  libraries?: SchemaValue;
  typeSafety?: SchemaValue;
  agents?: SchemaValue;
  plugins?: SchemaValue;
  surfaces?: SchemaValue;
  const?: SchemaValue;
  enum?: SchemaValue;
  items?: SchemaValue;
}

let cwd = '';
let external = '';

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'lintel-config-'));
  external = await mkdtemp(join(tmpdir(), 'lintel-config-external-'));
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
  await rm(external, {
    recursive: true,
    force: true,
  });
});

const config = (overrides: ConfigOverrides = {}): string => {
  return JSON.stringify({
    $schema: CONFIG_SCHEMA_URL,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    ...DEFAULT_ANSWERS,
    ...overrides,
  });
};

const readOptional = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf8');
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isSchemaObject = (value: unknown): value is SchemaFields => {
  return isObject(value);
};

const objectField = (value: SchemaFields, field: keyof SchemaFields): SchemaFields => {
  const fieldValueResult = value[field];

  if (!isSchemaObject(fieldValueResult)) {
    throw new Error(`schema field ${field} must be an object`);
  }

  return fieldValueResult;
};

const stringField = (value: SchemaFields, field: keyof SchemaFields): string => {
  const fieldValueResult = value[field];

  if (typeof fieldValueResult !== 'string') {
    throw new Error(`schema field ${field} must be a string`);
  }

  return fieldValueResult;
};

const numberField = (value: SchemaFields, field: keyof SchemaFields): number => {
  const fieldValueResult = value[field];

  if (typeof fieldValueResult !== 'number') {
    throw new Error(`schema field ${field} must be a number`);
  }

  return fieldValueResult;
};

const stringArrayField = (value: SchemaFields, field: keyof SchemaFields): string[] => {
  const fieldValueResult = value[field];

  if (!Array.isArray(fieldValueResult) || !fieldValueResult.every((item) => {
    return typeof item === 'string';
  })) {
    throw new Error(`schema field ${field} must be a string array`);
  }

  return fieldValueResult;
};

const choiceNode = (properties: SchemaFields, field: keyof SchemaFields): SchemaNode => {
  return { choices: stringArrayField(objectField(properties, field), 'enum') };
};

const schemaFrom = (text: string): LintelConfigSchema => {
  const parsed: unknown = JSON.parse(text);

  if (!isSchemaObject(parsed)) {
    throw new Error('schema must be an object');
  }

  const properties = objectField(parsed, 'properties');
  const libraries = objectField(properties, 'libraries');

  return {
    $id: stringField(parsed, '$id'),
    properties: {
      schemaVersion: { constant: numberField(objectField(properties, 'schemaVersion'), 'const') },
      target: choiceNode(properties, 'target'),
      testing: choiceNode(properties, 'testing'),
      packageManager: choiceNode(properties, 'packageManager'),
      libraries: { items: choiceNode(libraries, 'items') },
      typeSafety: choiceNode(properties, 'typeSafety'),
      agents: { items: choiceNode(objectField(properties, 'agents'), 'items') },
      plugins: { items: choiceNode(objectField(properties, 'plugins'), 'items') },
      surfaces: { items: choiceNode(objectField(properties, 'surfaces'), 'items') },
    },
  };
};

describe('emitLintelConfig', () => {
  it('writes the version-one envelope around every answer', () => {
    expect(JSON.parse(emitLintelConfig(DEFAULT_ANSWERS))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      ...DEFAULT_ANSWERS,
    });
  });
});

describe('parseLintelConfig', () => {
  it('reads the version-one envelope and every answer', () => {
    expect(parseLintelConfig(emitLintelConfig(DEFAULT_ANSWERS)))
      .toEqual({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 1,
        ...DEFAULT_ANSWERS,
      });
  });

  /**
   * All three fields arrived after the schema did, so a config written without them still has to parse: an absent
   * `browser` is the chrome the only extension target used to assume, an absent `hostedFramework` is the
   * plain-TypeScript shape every host had, and absent `surfaces` is the popup and background pair.
   */
  it('defaults the extension axes when a config predates them', () => {
    const withoutAxes = JSON.stringify({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      target: 'webextension',
      testing: 'vitest',
      packageManager: 'pnpm',
      libraries: [],
      store: false,
      typeSafety: 'strict',
      agents: ['claude-code'],
      plugins: [],
    });

    const config = parseLintelConfig(withoutAxes);

    expect(config.browser).toBe('chrome');
    expect(config.hostedFramework).toBeUndefined();
    // Left absent rather than filled in, so the file keeps saying what its author said.
    expect(config.surfaces).toBeUndefined();
    expect(surfacesOf(config)).toEqual(['popup', 'background']);
  });

  it('round-trips all three extension axes', () => {
    // Annotated rather than `as const`: a readonly tuple is not assignable to the mutable list `Answers` declares.
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browser: 'firefox',
      hostedFramework: 'solid',
      surfaces: ['devtools-panel'],
    };

    expect(parseLintelConfig(emitLintelConfig(answers)))
      .toEqual({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 1,
        ...answers,
      });
  });

  it.each([
    ['browser', 'safari'],
    ['hostedFramework', 'angular'],
  ])('rejects an unknown %s', (field, value) => {
    const config = {
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      ...DEFAULT_ANSWERS,
      [field]: value,
    };

    expect(() => {
      return parseLintelConfig(JSON.stringify(config));
    }).toThrow(new RegExp(`${field} must be one of`));
  });

  it('round-trips the resolver conditions', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      resolveConditions: ['import', 'default'],
    };

    expect(parseLintelConfig(emitLintelConfig(answers))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      ...answers,
    });
  });

  // An open vocabulary, so the shape is what gets validated: a non-empty list of distinct non-empty strings.
  it.each([
    [[], 'must be a non-empty array'],
    [['import', ''], 'must contain only non-empty strings'],
    [['import', 1], 'must contain only non-empty strings'],
    [['import', 'import'], 'must not contain duplicate values'],
    ['import', 'must be a non-empty array'],
  ])('rejects resolveConditions of %j', (resolveConditions, message) => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 1,
        ...DEFAULT_ANSWERS,
        resolveConditions,
      }));
    }).toThrow(new RegExp(message));
  });

  /**
   * The reason this field exists rather than being hand-edited into `eslint.config.js`: that file is emitted whole,
   * so an alias added there is gone on the next sync. Recorded here it reaches the config, the tsconfig paths and the
   * resolver together, which is the coupling `emitTsconfig.test.ts` pins.
   */
  it('round-trips a project\'s own aliases, in both shapes', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      aliases: {
        '@engine': './src/lib/engine/index.ts',
        '@workers/*': './src/workers/*',
      },
    };

    expect(parseLintelConfig(emitLintelConfig(answers))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      ...answers,
    });
  });

  // The names are a project's to choose, so the sigil is all that is checked: both consumers key on it, and a bare
  // `engine` sorts as a package rather than as the project's own.
  it.each([
    [{ engine: './src/lib/engine' }, 'must start with @ or \\$'],
    [{ '@engine': '' }, 'must be a non-empty string'],
    [{ '@engine': 3 }, 'must be a non-empty string'],
    [['@engine'], 'aliases must be an object'],
    ['@engine', 'aliases must be an object'],
  ])('rejects aliases of %j', (aliases, message) => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 1,
        ...DEFAULT_ANSWERS,
        aliases,
      }));
    }).toThrow(new RegExp(message));
  });

  // Separate from `browser`, which still decides the background shape, the ambient types and the starter code.
  it('round-trips the stores a project packages for', () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      target: 'webextension',
      browsers: ['chrome', 'firefox'],
    };

    expect(parseLintelConfig(emitLintelConfig(answers))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      ...answers,
    });
  });

  it.each([
    [[], 'must contain at least 1 value'],
    [['chrome', 'chrome'], 'must not contain duplicate values'],
    [['safari'], 'must be one of'],
  ])('rejects browsers of %j', (browsers, message) => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 1,
        ...DEFAULT_ANSWERS,
        browsers,
      }));
    }).toThrow(new RegExp(message));
  });

  /**
   * Not for build outputs, which `base()` already covers by reading `.gitignore`. This exists for the one thing that
   * file cannot name: a generated file the project commits, which a reference repo has as a compat-data registry its
   * CI regenerates and diffs.
   */
  it("round-trips a project's own ignores", () => {
    const answers: Answers = {
      ...DEFAULT_ANSWERS,
      ignores: ['src/lib/compat-data/generatedRegistry.ts'],
    };

    expect(parseLintelConfig(emitLintelConfig(answers))).toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: 1,
      ...answers,
    });
  });

  it.each([
    [[], 'must be a non-empty array'],
    [['a', ''], 'must contain only non-empty strings'],
    [['a', 2], 'must contain only non-empty strings'],
    [['a', 'a'], 'must not contain duplicate values'],
    ['a', 'must be a non-empty array'],
  ])('rejects ignores of %j', (ignores, message) => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 1,
        ...DEFAULT_ANSWERS,
        ignores,
      }));
    }).toThrow(new RegExp(message));
  });

  it('rejects malformed JSON', () => {
    expect(() => {
      return parseLintelConfig('{');
    }).toThrow(/lintel\.config\.json is not valid JSON/);
  });

  it('rejects a missing schema version', () => {
    expect(() => {
      return parseLintelConfig('{}');
    }).toThrow(/schemaVersion/);
  });

  // A hand-edited string is no version to compare, so it is malformed rather than unsupported.
  it('rejects a schema version that is not a number', () => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: '1',
      }));
    }).toThrow(/schemaVersion must be 1/);
  });

  it('rejects a future schema version before version-one fields', () => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 2,
      }));
    }).toThrow(/schema version 2.*update @linteljs\/create/);
  });

  it('rejects a future schema version before inspecting new object-valued fields', () => {
    expect(() => {
      return parseLintelConfig(JSON.stringify({
        $schema: CONFIG_SCHEMA_URL,
        schemaVersion: 2,
        future: { nested: true },
      }));
    }).toThrow(/schema version 2.*update @linteljs\/create/);
  });

  it.each([
    ['a non-object value', '[]', /lintel\.config\.json must be a JSON object/],
    ['an unexpected property', config({ unexpected: true }), /unexpected property: unexpected/],
    // Pinned by name rather than left to the generic case above: DESIGN.md's "No JavaScript output" rests on this
    // refusal, since planning such a project as TypeScript rewrites its config over source that is not.
    ['a project recorded as javascript', config({ typescript: false }), /unexpected property: typescript/],
    ['a different schema URL', config({ $schema: 'https://example.com/schema.json' }), /\$schema must be/],
    [
      'a missing target',
      config({ target: undefined }),
      /target must be one of: react, next, vue, svelte, solid, angular, astro, webextension, react-native/,
    ],
    [
      'an unknown target',
      config({ target: 'ember' }),
      /target must be one of: react, next, vue, svelte, solid, angular, astro, webextension, react-native/,
    ],
    ['an unknown testing choice', config({ testing: 'jest' }), /testing must be one of: vitest, none/],
    [
      'an unknown package manager',
      config({ packageManager: 'deno' }),
      /packageManager must be one of: pnpm, npm, yarn, bun/,
    ],
    ['a non-array library list', config({ libraries: 'zod' }), /libraries must be an array/],
    [
      'an unknown library',
      config({ libraries: ['jquery'] }),
      /libraries must be one of: zod, tanstack-query, tailwind/,
    ],
    ['a duplicate library', config({ libraries: ['zod', 'zod'] }), /libraries must not contain duplicate values/],
    ['a non-boolean store', config({ store: 'false' }), /store must be a boolean/],
    [
      'an unknown type-safety choice',
      config({ typeSafety: 'unchecked' }),
      /typeSafety must be one of: strict, relaxed/,
    ],
    ['a non-array agent list', config({ agents: 'codex' }), /agents must be an array/],
    ['an empty agent list', config({ agents: [] }), /agents must contain at least 1 value/],
    ['an unknown agent', config({ agents: ['cursor'] }), /agents must be one of: claude-code, codex/],
    ['a duplicate agent', config({ agents: ['codex', 'codex'] }), /agents must not contain duplicate values/],
    ['a non-array plugin list', config({ plugins: 'ponytail' }), /plugins must be an array/],
    [
      'a non-string plugin',
      config({ plugins: [1] }),
      /plugins must be one of: ponytail, context7, frontend-design/,
    ],
    [
      'an unknown plugin',
      config({ plugins: ['cursor'] }),
      /plugins must be one of: ponytail, context7, frontend-design/,
    ],
    ['a duplicate plugin', config({ plugins: ['ponytail', 'ponytail'] }), /plugins must not contain duplicate values/],
  ])('rejects %s', (_case, text, error) => {
    expect(() => {
      return parseLintelConfig(text);
    }).toThrow(error);
  });
});

describe('readLintelConfig', () => {
  it('reads a valid config file', async () => {
    await writeFile(join(cwd, CONFIG_PATH), emitLintelConfig(DEFAULT_ANSWERS), 'utf8');

    await expect(readLintelConfig(cwd)).resolves.toEqual({
      $schema: CONFIG_SCHEMA_URL,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      ...DEFAULT_ANSWERS,
    });
  });

  it('preserves the parse error for malformed JSON', async () => {
    await writeFile(join(cwd, CONFIG_PATH), '{', 'utf8');

    await expect(readLintelConfig(cwd)).rejects.toThrow(/lintel\.config\.json is not valid JSON/);
  });

  it('leaves the config file byte-for-byte unchanged', async () => {
    const text = emitLintelConfig(DEFAULT_ANSWERS);

    await writeFile(join(cwd, CONFIG_PATH), text, 'utf8');
    await readLintelConfig(cwd);

    await expect(readFile(join(cwd, CONFIG_PATH), 'utf8')).resolves.toBe(text);
  });

  it.each([
    ['live', emitLintelConfig(DEFAULT_ANSWERS)],
    ['dangling', null],
  ])('rejects a %s symbolic-link config without touching its target', async (_case, original) => {
    const target = join(external, 'actual-config.json');
    const path = join(cwd, CONFIG_PATH);

    if (original !== null) {
      await writeFile(target, original, 'utf8');
    }

    await symlink(target, path);

    await expect(readLintelConfig(cwd)).rejects.toThrow(
      'lintel.config.json must be a regular file; symbolic links are not allowed',
    );
    await expect(readlink(path)).resolves.toBe(target);
    await expect(readOptional(target)).resolves.toBe(original);
  });

  it('rejects a non-regular config entry before trying to read it', async () => {
    await mkdir(join(cwd, CONFIG_PATH));

    await expect(readLintelConfig(cwd))
      .rejects.toThrow('lintel.config.json must be a regular file');
  });

  it('rejects a directory without a LintelJS config', async () => {
    await expect(readLintelConfig(cwd))
      .rejects.toThrow('lintel.config.json was not found; this is not a LintelJS-managed project');
  });
});

describe('lintel config schemas', () => {
  it('keep the canonical and packaged schemas in sync with the answer vocabulary', async () => {
    const [canonical, packaged] = await Promise.all([
      readFile(join(process.cwd(), 'schemas/lintel.config.v1.schema.json'), 'utf8'),
      readFile(join(process.cwd(), 'packages/create/assets/schemas/lintel.config.v1.schema.json'), 'utf8'),
    ]);
    const canonicalJson: unknown = JSON.parse(canonical);
    const packagedJson: unknown = JSON.parse(packaged);
    const canonicalSchema = schemaFrom(canonical);
    const packagedSchema = schemaFrom(packaged);

    expect(packagedJson).toEqual(canonicalJson);
    expect(packagedSchema).toEqual(canonicalSchema);
    expect(canonicalSchema.$id).toBe(CONFIG_SCHEMA_URL);
    expect(canonicalSchema.properties.schemaVersion.constant).toBe(CURRENT_SCHEMA_VERSION);
    expect(canonicalSchema.properties.target.choices).toEqual(TARGET_IDS);
    expect(canonicalSchema.properties.testing.choices).toEqual(TESTING_CHOICES);
    expect(canonicalSchema.properties.packageManager.choices).toEqual(PACKAGE_MANAGERS);
    expect(canonicalSchema.properties.libraries.items?.choices).toEqual(LIBRARIES);
    expect(canonicalSchema.properties.typeSafety.choices).toEqual(TYPE_SAFETY_CHOICES);
    expect(canonicalSchema.properties.agents.items?.choices).toEqual(AGENTS);
    expect(canonicalSchema.properties.plugins.items?.choices).toEqual(PLUGINS);
    expect(canonicalSchema.properties.surfaces.items?.choices).toEqual(SURFACES);
  });
});
