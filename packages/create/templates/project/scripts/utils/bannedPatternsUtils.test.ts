import {
  mkdir,
  mkdtemp,
  rm,
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
  vi,
} from 'vitest';

import {
  type BannedScan,
  BASE_SKIPPED,
  checkBanned,
  FLOORS,
} from './bannedPatternsUtils.ts';

const STRICT: BannedScan = {
  patterns: FLOORS.strict,
  skipped: BASE_SKIPPED,
  extensions: ['.ts', '.tsx'],
};

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-banned-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  vi.restoreAllMocks();

  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

// What it logs when it fails, or '' when it passes.
const reportOf = (paths: string[], scan: BannedScan = STRICT): string => {
  const errors = vi.spyOn(console, 'error')
    .mockReturnValue();
  const code = checkBanned(paths, scan);
  const logged = errors.mock.calls
    .flat()
    .join('\n');

  return code === 0 ? '' : logged;
};

const checkFile = async (name: string, source: string, scan: BannedScan = STRICT): Promise<string> => {
  const path = join(cwd, name);
  await writeFile(path, source, 'utf8');

  return reportOf([path], scan);
};

const check = async (source: string): Promise<string> => {
  return checkFile('sample.ts', source);
};

describe('the escape hatches it exists to block', () => {
  it.each([
    ['as never', 'const value = input as never;\n'],
    ['as unknown', 'const value = input as unknown as Target;\n'],
    ['a bare unknown annotation', 'const value: unknown = load();\n'],
    ['an unknown return', 'const load = (): unknown => {\n  return 1;\n};\n'],
    ['a string index signature', 'interface Bag {\n  [key: string]: number;\n}\n'],
    ['an eslint-disable directive', '// eslint-disable-next-line no-console\nconsole.log(1);\n'],
    ['a ts-expect-error directive', '// @ts-expect-error wrong on purpose\nconst value = 1;\n'],
  ])('reports %s', async (_label, source) => {
    const actual = await check(source);
    expect(actual).not.toBe('');
  });
});

describe('the carve-out the rule file grants', () => {
  it.each([
    ['a narrowing type guard', 'const isTarget = (value: unknown): value is Target => {\n  return true;\n};\n'],
    ['the parsed payload it narrows', 'const parsed: unknown = JSON.parse(text);\n'],
    ['a guard parameter', 'const parsedAs = <T>(text: string, guard: (value: unknown) => value is T): T | null => {\n'],
    ['a guard type alias', 'type Guard<T> = (value: unknown) => value is T;\n'],
    ['a guard type spaced any way', 'type Guard<T> = ( value :unknown )=>value  is T;\n'],
    ['a dynamic import namespace', 'const loaded: unknown = await import(`./rules/${name}.ts`);\n'],
    ['a caught value', 'const messageOf = (error: unknown): string => {\n  return String(error);\n};\n'],
    ['a caught value named cause', 'const codeOf = (cause: unknown): string => {\n  return String(cause);\n};\n'],
    ['a caught value in a promise chain', 'run().catch((err: unknown) => {\n  report(err);\n});\n'],
    ['a caught value in an async promise chain', 'run().catch(async (e: unknown) => {\n  await report(e);\n});\n'],
    ['a labelled tuple element', 'const emit = defineEmits<{\n  change: [value: string];\n}>();\n'],
    ['a named tuple type', 'type Pair = [first: string, second: number];\n'],
  ])('allows %s', async (_label, source) => {
    const actual = await check(source);
    expect(actual).toBe('');
  });

  it('still blocks an unknown binding with no boundary behind it', async () => {
    const actual = await check('const loaded: unknown = other;\n');
    expect(actual).toContain('[: unknown]');
  });

  it.each([
    ['a callback answering a boolean', 'const f = (run: (value: unknown) => boolean): void => {\n'],
    ['a predicate on another name', 'const f = (run: (value: unknown) => other is T): void => {\n'],
    ['a second parameter beside it', 'const f = (error: unknown, name: string): string => {\n  return name;\n};\n'],
    ['a parameter named for anything else', 'const f = (value: unknown): string => {\n  return String(value);\n};\n'],
    ['a caught value in a wider list', 'const f = (name: string, error: unknown): string => {\n  return name;\n};\n'],
  ])('still blocks %s', async (_label, source) => {
    const actual = await check(source);
    expect(actual).toContain('[: unknown]');
  });
});

describe('each pattern, reported under its own name', () => {
  it.each([
    ['as unknown as', 'const value = input as unknown as Target;'],
    ['as unknown', 'const value = input as unknown;'],
    [': unknown', 'const value:unknown = load();'],
    ['=> unknown', 'type Load = () =>unknown;'],
    ['=> unknown', 'type Load = () => unknown;'],
    ['unknown[]', 'type List = unknown[];'],
    ['<unknown>', 'const cache = new Set<unknown>();'],
    ['@ts-ignore', '// @ts-ignore'],
    ['@ts-expect-error', '// @ts-expect-error wrong on purpose'],
    ['coverage ignore', '/* v8 ignore next 3 */'],
    ['coverage ignore', '// v8 ignore next'],
    ['coverage ignore', '/* c8 ignore start */'],
    ['coverage ignore', '// c8 ignore next'],
    ['coverage ignore', '/* istanbul ignore else */'],
    ['coverage ignore', '// istanbul  ignore next'],
    ['Record<string, unknown>', 'type Bag = Record<string,unknown>;'],
    ['Record<string, unknown>', 'type Bag = Record<string, unknown>;'],
    ['index signature', 'interface Bag { [key:string]: number }'],
    ['index signature', 'interface Bag { [key: string] : number }'],
    ['as never', 'const value = input as never'],
    ['as never', 'input as never;'],
    ['as never', "const value = (await import('./value.ts')) as never;"],
    ['as never', 'const value = input as never; export { value };'],
    ['as never', 'const value = input as never// a flush comment'],
    ['as never', 'const a = `\\\\\\ `; const value = input as never; const b = `x`;'],
  ])('reports [%s] on %s', async (name, line) => {
    const actual = await check(`${line}\n`);
    expect(actual).toContain(`1: ${line}  [${name}]`);
  });

  it.each([
    'const isTarget = (value:unknown ) :value  is Target => {',
    'const parsed:unknown  =JSON.parse(text);',
    "const loaded:unknown  =await import('./value.ts');",
    'const messageOf = ( reason :unknown ): string => {',
    'run().catch( async( err :unknown ) => {',
  ])('allows the carve-out spaced as in %s', async (line) => {
    const actual = await check(`${line}\n`);
    expect(actual).toBe('');
  });
});

describe('mentions rather than directives', () => {
  it.each([
    ['a line comment naming a disable', 'const value = 1; // an `eslint-disable-next-line` here would be wrong\n'],
    ['prose naming ts-ignore', 'const value = 1; // never reach for `@ts-ignore`\n'],
    ['prose naming a coverage ignore', 'const value = 1; // a `v8 ignore` would hide the branch\n'],
    [
      'a banned pattern inside a multiline template',
      'const fixture = [\n  `function load(value: unknown) {`,\n  `  return value;`,\n].join("");\n',
    ],
    [
      'a banned pattern inside a block comment',
      '/**\n * Never write `value: unknown` outside a guard.\n */\nconst value = 1;\n',
    ],
    [
      'a directive inside a string literal',
      "const fixture = '// eslint-disable-next-line no-console';\n",
    ],
    [
      'a directive inside a multiline template',
      'const fixture = `\n// @ts-ignore\nconst value = 1;\n`;\n',
    ],
    ['a directive inside a one-line template', 'const fixture = `// @ts-ignore`;\n'],
    ['a pattern inside a double-quoted string', 'const fixture = "input as never";\n'],
    ['a pattern after an escaped quote', "const fixture = 'it\\' as never';\n"],
    ['a pattern inside a line comment', 'const value = 1; // never write input as never\n'],
    ['a directive on a later line of a block comment', '/**\n * // eslint-disable-next-line\n */\nconst value = 1;\n'],
  ])('says nothing about %s', async (_label, source) => {
    const actual = await check(source);
    expect(actual).toBe('');
  });

  it('still reports the same directive written as one', async () => {
    const actual = await check('// eslint-disable-next-line no-console\nconsole.log(1);\n');

    expect(actual)
      .toContain('[eslint-disable]');
  });
});

describe('single-file components', () => {
  it('reads the script block of a .vue file', async () => {
    const source = [
      '<script setup lang="ts">',
      'const value = input as never;',
      'const options: unknown = load();',
      '</script>',
      '',
      '<template>',
      '  <p>{{ value }}</p>',
      '</template>',
      '',
    ].join('\n');
    const report = await checkFile('App.vue', source);

    expect(report).toContain('2: const value = input as never;');
    expect(report).toContain('3: const options: unknown = load();');
  });

  it('reads the script block of a .svelte file', async () => {
    const source = [
      '<script lang="ts">',
      '  let value = input as never;',
      '</script>',
      '',
      '<p>{value}</p>',
      '',
    ].join('\n');
    const report = await checkFile('Page.svelte', source);

    expect(report).toContain('2: let value = input as never;');
  });

  it('never reads the template or the styles as if they were TypeScript', async () => {
    const source = [
      '<script setup lang="ts">',
      "const heading = 'Banned shapes';",
      '</script>',
      '',
      '<template>',
      '  <h2>{{ heading }}</h2>',
      '  <pre>const value = input as never;</pre>',
      '  <pre>const options: unknown = load();</pre>',
      '  <ul>',
      '    <li v-for="item in [1]" :key="item">{{ item }}</li>',
      '  </ul>',
      '</template>',
      '',
      '<style scoped>',
      '.a { color: red; }',
      '</style>',
      '',
    ].join('\n');
    const actual = await checkFile('Docs.vue', source);
    expect(actual).toBe('');
  });
});

describe('its arguments', () => {
  const run = (...paths: string[]): string => {
    const absolute = paths
      .map((path) => {
        return join(cwd, path);
      });

    return reportOf(absolute);
  };

  beforeEach(async () => {
    await mkdir(join(cwd, 'src/nested/node_modules/pkg'), { recursive: true });
    await mkdir(join(cwd, 'src/.cache'), { recursive: true });
    await writeFile(join(cwd, 'src/clean.ts'), 'export const clean = 1;\n', 'utf8');
    await writeFile(join(cwd, 'src/nested/deep.tsx'), 'export const deep = input as never;\n', 'utf8');
    await writeFile(join(cwd, 'src/nested/node_modules/pkg/index.ts'), 'export const a = b as never;\n', 'utf8');
    await writeFile(join(cwd, 'src/.cache/cached.ts'), 'export const a = b as never;\n', 'utf8');
    await writeFile(join(cwd, 'src/notes.md'), 'x as never\n', 'utf8');
  });

  it('walks a directory for the scanned extensions, past node_modules and dot-directories', () => {
    const report = run('src');

    expect(report).toContain(join('src', 'nested', 'deep.tsx'));
    expect(report).not.toContain('node_modules');
    expect(report).not.toContain('.cache');
    expect(report).not.toContain('notes.md');
  });

  it('checks a named file whatever directory it sits in', () => {
    const nestedReport = run(join('src', 'nested', 'node_modules', 'pkg', 'index.ts'));
    expect(nestedReport).toContain('[as never]');
    const cleanReport = run(join('src', 'clean.ts'));
    expect(cleanReport).toBe('');
  });

  it('passes a directory with nothing banned in it', async () => {
    await rm(join(cwd, 'src/nested/deep.tsx'));

    const actual = run('src');
    expect(actual).toBe('');
  });
});

describe('lines where `as` is not an assertion', () => {
  it.each([
    ['a namespace import', "import * as path from 'node:path';\n"],
    ['a named import alias', "import { join as joined } from 'node:path';\n"],
    ['a re-export alias', "export { value as never } from './value';\n"],
    ['an alias line in a list', '  value as never,\n'],
    ['a namespace re-export', "export * as never from './never';\n"],
    ['an import alias', "import { value as never } from './value';\n"],
    ['an indented import alias', "  import { value as never } from './value';\n"],
    ['a type re-export spaced any way', "  export  type  { Value as never } from './value';\n"],
    ['an alias line with trailing space', '  value as never, \n'],
    ['an unindented alias line with no comma', 'value as never\n'],
    ['a type alias line spaced before the name', '  type  Value as never\n'],
    ['an alias line spaced before its as', '  value  as never\n'],
  ])('says nothing about %s', async (_label, source) => {
    const actual = await check(source);
    expect(actual).toBe('');
  });
});

describe('block comments', () => {
  it('reports a directive written as a block comment', async () => {
    const actual = await check('/* eslint-disable no-console */\nconsole.log(1);\n');
    expect(actual).toContain('1: /* eslint-disable no-console */  [eslint-disable]');
  });

  it('reports each hit on its own line, and only there', async () => {
    const source = '/* eslint-disable no-console */\nconsole.log(1);\nconst value = input as never;\n';
    const actual = await check(source);
    const expected = ':\n  1: /* eslint-disable no-console */  [eslint-disable]\n'
      + '  3: const value = input as never;  [as never]\n';
    expect(actual).toContain(expected);
  });

  it('reads a directive only on the first line of a block comment', async () => {
    const actual = await check('/**\n// eslint-disable-next-line\n */\nconst value = 1;\n');
    expect(actual).toBe('');
  });

  it('lets a template literal own a comment opener inside it', async () => {
    const actual = await check('const glob = `src/*`;\nconst value = input as never;\nconst end = 1; // */\n');
    expect(actual).toContain('2: const value = input as never;');
  });

  it('reports a coverage ignore on the first line of a block comment', async () => {
    const actual = await check('/* v8 ignore next 3 -- unreachable\n * by type\n */\nconst value = 1;\n');
    expect(actual).toContain('1: /* v8 ignore next 3 -- unreachable  [coverage ignore]');
  });
});

describe('the floor and the skips', () => {
  it('lets the relaxed floor keep what only strict bans', async () => {
    const scan: BannedScan = {
      ...STRICT,
      patterns: FLOORS.relaxed,
    };
    const actual = await checkFile('relaxed.ts', 'const value = input as never;\n', scan);
    expect(actual).toBe('');
  });

  it('bans a coverage ignore on the relaxed floor too', async () => {
    const scan: BannedScan = {
      ...STRICT,
      patterns: FLOORS.relaxed,
    };
    const actual = await checkFile('relaxed.ts', '/* c8 ignore next */\nconst value = 1;\n', scan);
    expect(actual).toContain('[coverage ignore]');
  });

  it('skips a path under scripts, given absolute or relative', async () => {
    await mkdir(join(cwd, 'scripts'));
    const absolute = await checkFile('scripts/tool.ts', 'const value = input as never;\n');
    expect(absolute).toBe('');

    const relative = reportOf(['scripts/missing.ts']);
    expect(relative).toBe('');
  });

  it('skips a file it cannot read and a file that is not a script', async () => {
    const missing = reportOf([join(cwd, 'missing.ts')]);
    expect(missing).toBe('');

    const notes = await checkFile('notes.md', 'const value = input as never;\n');
    expect(notes).toBe('');
    const tsv = await checkFile('data.tsv', 'const value = input as never;\n');
    expect(tsv).toBe('');
  });

  it.each(['module.mts', 'shim.vue.ts'])('reads %s as TypeScript', async (name) => {
    const actual = await checkFile(name, 'const value = input as never;\n');
    expect(actual).toContain('1: const value = input as never;  [as never]');
  });

  it('skips a path under any of several fragments', async () => {
    await mkdir(join(cwd, 'scripts'));
    const scan: BannedScan = {
      ...STRICT,
      skipped: ['/generated/', ...BASE_SKIPPED],
    };
    const actual = await checkFile('scripts/tool.ts', 'const value = input as never;\n', scan);
    expect(actual).toBe('');
  });

  it('reads a relative path from the working directory, and skips it under scripts', async () => {
    await mkdir(join(cwd, 'scripts'));
    await mkdir(join(cwd, 'src'));
    await writeFile(join(cwd, 'scripts/tool.ts'), 'const value = input as never;\n', 'utf8');
    await writeFile(join(cwd, 'src/tool.ts'), 'const value = input as never;\n', 'utf8');
    const previous = process.cwd();
    process.chdir(cwd);

    try {
      const skipped = reportOf(['scripts/tool.ts']);
      expect(skipped).toBe('');
      const checked = reportOf(['src/tool.ts']);
      expect(checked).toContain('Banned pattern in src/tool.ts');
    }
    finally {
      process.chdir(previous);
    }
  });

  it('prints the fix hint once after the reports', async () => {
    const actual = await check('const value = input as never;\n');
    expect(actual).toMatch(/\[as never\]\n\[ERROR\] Fix the source/u);
  });
});
