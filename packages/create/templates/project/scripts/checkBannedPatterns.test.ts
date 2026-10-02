import { spawnSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execPath } from 'node:process';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { TEMPLATES_ROOT } from '../../../src/disk';

const CHECKER = join(TEMPLATES_ROOT, 'project/scripts/checkBannedPatterns.ts');

let cwd = '';

beforeEach(async () => {
  const prefix = join(tmpdir(), 'linteljs-banned-');
  cwd = await mkdtemp(prefix);
});

afterEach(async () => {
  await rm(cwd, {
    recursive: true,
    force: true,
  });
});

const check = async (source: string): Promise<string> => {
  const path = join(cwd, 'sample.ts');
  await writeFile(path, source, 'utf8');

  const { status, stderr } = spawnSync(execPath, [CHECKER, path], { encoding: 'utf8' });

  return status === 0 ? '' : stderr;
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

describe('mentions rather than directives', () => {
  it.each([
    ['a line comment naming a disable', 'const value = 1; // an `eslint-disable-next-line` here would be wrong\n'],
    ['prose naming ts-ignore', 'const value = 1; // never reach for `@ts-ignore`\n'],
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
  const checkFile = async (name: string, source: string): Promise<string> => {
    const path = join(cwd, name);
    await writeFile(path, source, 'utf8');

    const { status, stderr } = spawnSync(execPath, [CHECKER, path], { encoding: 'utf8' });

    return status === 0 ? '' : stderr;
  };

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
    const { status, stderr } = spawnSync(execPath, [CHECKER, ...paths], {
      cwd,
      encoding: 'utf8',
    });

    return status === 0 ? '' : stderr;
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
