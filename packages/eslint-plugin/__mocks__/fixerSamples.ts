import { runInNewContext } from 'node:vm';

import * as astroParser from 'astro-eslint-parser';
import {
  type AST,
  Linter,
  type Rule,
  type SourceCode,
} from 'eslint';
import svelteParser from 'svelte-eslint-parser';
import ts from 'typescript';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

import { rules } from '../src/rules/index.ts';

export interface FixerSample {
  name: string;
  code: string;
  typescript?: boolean | undefined;
  // Without one every snippet is `<input>`, so JSX never kicks in.
  filename?: string | undefined;
  // Declared, not sniffed out of the text, so the CRLF set is a decision.
  crlf?: true;
  // An LF file carrying one CRLF line, which a fixer must not spread.
  strayCrlf?: true;
}

export const FIXER_SAMPLES: FixerSample[] = [
  {
    // The shape it inserts before: a first statement that is not an import.
    name: 'React global ahead of any import',
    code: 'const node: React.ReactNode = null;\nexport { node };',
    typescript: true,
    filename: 'widget.ts',
  },
  {
    // An import ahead of `'use client'` stops it being a directive. Indented on purpose.
    name: 'React global under a use client directive',
    code: "'use client';\n\ninterface Props {\n  children?: React.ReactNode;\n}\n\nexport type { Props };\n",
    typescript: true,
    filename: 'panel.tsx',
  },
  {
    // typescript-eslint gives every ExpressionStatement a `directive` key; the fix must not throw on it.
    name: 'React global in a file of expression statements',
    code: "React.createElement('div');\n",
    typescript: true,
    filename: 'render.ts',
  },
  {
    // Importing into a declaration file makes it a module, and its globals stop being global.
    name: 'React global in a global declaration file',
    code: "declare module '*.svg' {\n  const Component: React.FC;\n  export default Component;\n}\n",
    typescript: true,
    filename: 'custom.d.ts',
  },
  {
    // Deeper than ESLint's ten fix passes, so each rewrite must span only its own callback.
    name: 'callbacks nested twelve deep',
    code: [
      ...Array.from({ length: 12 }, (_, depth) => {
        return `${'  '.repeat(depth)}items.forEach(function (item) {\n`;
      }),
      `${'  '.repeat(12)}run(item);\n`,
      ...Array.from({ length: 12 }, (_, depth) => {
        return `${'  '.repeat(11 - depth)}});\n`;
      }),
    ].join(''),
  },
  {
    // Deeper than ESLint's ten fix passes, so each fix must span only its own chain.
    name: 'chains nested twelve deep',
    code: `let a, x, y;\n${Array.from({ length: 12 })
      .reduce<string>((inner) => {
        return `a.b(${inner}).c(y)`;
      }, 'x')};\n`,
  },
  {
    // A later chain on the line must take the indent of the line it lands on.
    name: 'sibling chains on one line',
    code: 'let a, b, c;\nrun(a.map(f).filter(g), b.map(f).filter(g), c.map(f).filter(g));\n',
  },
  {
    // More reaches than ESLint's ten fix passes, so they must land in one edit of the import.
    name: 'twelve React globals in one file',
    code: ['useState', 'useEffect', 'useMemo', 'useRef', 'useId', 'useContext', 'useReducer', 'useCallback',
      'useLayoutEffect', 'useTransition', 'useDeferredValue', 'useSyncExternalStore']
      .map((hook) => {
        return `export const ${hook}Ref = React.${hook};\n`;
      })
      .join(''),
    typescript: true,
    filename: 'hooks.ts',
  },
  {
    // Bound to a type; rewriting the tags against it makes a value of a type-only binding.
    name: 'type-only react import beside a value reach',
    code: "import type { Fragment } from 'react';\n\nconst view = <React.Fragment>text</React.Fragment>;\n",
    typescript: true,
    filename: 'view.tsx',
  },
  {
    name: 'empty named import',
    code: "import {\n} from 'mod';",
  },
  {
    name: 'side-effect import over two lines',
    code: "import\n'mod';",
  },
  {
    name: 'string-literal import name',
    code: "import { 'a-b' as first, second, third } from 'mod';",
    typescript: true,
  },
  {
    name: 'import with a comment between specifiers',
    code: "import { alpha, /* keep */ bravo, charlie } from 'mod';",
  },
  {
    name: 'import attributes',
    code: "import data from './x.json' with { type: 'json' };",
    typescript: true,
  },
  {
    name: 'default-only import split over lines',
    code: "import\ndefaultExport from 'mod';",
  },
  // Under the member count, so the one pass collapses rather than splitting into a shape the next undoes.
  {
    name: 'half-split import under the member count',
    code: "import {\n  alpha, bravo } from 'mod';",
  },

  {
    name: 'export with a comment after the brace',
    code: "export { /* keep */ alpha, bravo } from 'mod';",
  },
  {
    name: 'export with a trailing comma',
    code: "export { alpha, bravo, } from 'mod';",
  },

  {
    name: 'rest target is a member expression',
    code: '({ alpha, bravo, ...target.rest } = source);',
  },
  // A pattern rebuild can drop the `?` between the closing brace and the annotation and still parse.
  {
    name: 'optional destructured parameter',
    code: 'declare function load({ alpha, bravo, charlie }?: Options): void;',
    typescript: true,
  },
  {
    name: 'optional destructured parameter on a method signature',
    code: 'interface Loader {\n  load({ alpha, bravo, charlie }?: Options): void;\n}',
    typescript: true,
  },
  {
    name: 'nested destructuring',
    code: 'const { alpha: { one, two, three }, bravo } = source;',
  },
  {
    name: 'destructuring with a comment',
    code: 'const { alpha, /* keep */ bravo, charlie } = source;',
  },
  {
    name: 'array pattern with a leading hole',
    code: 'const [, alpha, bravo,\n  charlie] = source;',
  },
  // The collapsed line would run past 120 characters, which no fixer here can shorten.
  {
    name: 'split destructuring too long to collapse',
    code: 'const {\n  alphaProperty = computeSomethingRatherLong(configuration),\n'
      + '  bravoProperty = computeSomethingElseEntirely(configuration)\n} = source;',
  },

  {
    name: 'array with holes, a spread, comments and a trailing comma',
    code: 'const list = [, alpha, /* about alpha */ ...rest, [bravo, charlie], // tail\n  delta,];',
  },
  {
    name: 'array element in parentheses',
    code: 'run([(alpha), bravo]);',
  },

  {
    name: 'negated function expression',
    code: '!function () {\n  run();\n}();',
  },
  {
    name: 'void function expression',
    code: 'void function () {\n  run();\n}();',
  },
  {
    name: 'typeof function expression',
    code: 'const kind = typeof function () {\n  return 1;\n};',
  },
  {
    name: 'new on a function expression',
    code: 'const made = new function () {\n  return 1;\n}();',
  },
  // `() => {}()` does not parse.
  {
    name: 'immediately invoked function expression',
    code: 'const value = function () {\n  return 1;\n}();',
  },
  {
    name: 'immediately invoked function expression as an argument',
    code: 'run(function () {\n  return 1;\n}());',
  },
  {
    name: 'immediately invoked function expression as a class field',
    code: 'class Service {\n  value = function () {\n    return 1;\n  }();\n}',
  },
  // Crockford's spelling: same nodes as `(function () {})(1)`, and only one can take an arrow.
  {
    name: 'immediately invoked function expression, parentheses outside',
    code: '(function (a) {\n  return a;\n}(1));',
  },
  {
    name: 'function expression with an as assertion',
    code: 'const fn = function (): number {\n  return 1;\n} as () => number;',
    typescript: true,
  },
  {
    name: 'self-referencing named function expression',
    code: 'const fact = function inner(n) {\n  return n <= 1 ? 1 : n * inner(n - 1);\n};',
  },
  {
    name: 'function with a comment between parameters',
    code: 'function greet(/* first */ alpha, bravo) {\n  return alpha + bravo;\n}',
  },
  // An arrow may never repeat a parameter name, so this is linted as `.cjs`.
  {
    name: 'duplicate parameter name in a sloppy function',
    code: 'function parseAdvanced(source, parse, _, _, tokenizers) {\n  return source;\n}\n',
    filename: 'sample.cjs',
  },
  // Annex B: a sloppy function declaration is legal as an if/else body and a label; const is legal in neither.
  {
    name: 'function declaration as an if body',
    code: 'if (flag) function helper() {\n  return 1;\n}\n',
    filename: 'sample.cjs',
  },
  {
    name: 'function declaration as an else body',
    code: 'if (flag) run();\nelse function helper() {\n  return 1;\n}\n',
    filename: 'sample.cjs',
  },
  {
    name: 'labelled function declaration',
    code: 'outer: function helper() {\n  return 1;\n}\n',
    filename: 'sample.cjs',
  },
  // `run()` reaches `helper` immediately, so a `const helper` two hops down sits in its dead zone.
  {
    name: 'function called before its declaration through another function',
    code: 'run();\n\nfunction run() {\n  helper();\n}\n\nfunction helper() {\n  return 1;\n}\n',
  },
  // The helper written first, so its one mention sits below it and reads as safe.
  {
    name: 'function declared before a hoisted caller that runs first',
    code: 'run();\n\nfunction helper() {\n  return 1;\n}\n\nfunction run() {\n  helper();\n}\n',
  },
  // A jump to a later case skips the declaration, so a `const` there is never initialised.
  {
    name: 'function declared in one switch case and called from a later one',
    code: 'const key = 1;\n\nswitch (key) {\n  case 0:\n    function helper() {\n      return 1;\n    }\n    break;\n'
      + '  case 1:\n    helper();\n}\n',
  },

  {
    name: 'hook dependencies with a comment',
    code: 'useEffect(() => {}, [\n  bravo, // needed\n  alpha,\n]);',
  },

  {
    name: 'union with a comment before the pipe',
    code: 'type Alpha = { first: string } /* keep */ | string;',
    typescript: true,
  },
  // The one gap a member split rewrites wholesale.
  {
    name: 'interface with a comment before the brace',
    code: 'interface Alpha { first: string; second: string; third: string; /* end */ }',
    typescript: true,
  },
  {
    name: 'type literal with a comment before the brace',
    code: 'type Alpha = { first: string; second: string; third: string; /* end */ };',
    typescript: true,
  },
  {
    name: 'use client directive with no imports',
    code: "'use client';\n\nconst value = 1;\n\ntype Alpha = string;\n",
    typescript: true,
  },
  {
    name: 'trailing comment on the statement before a type',
    code: 'const value = 1; // why it is one\n\ntype Alpha = string;\n',
    typescript: true,
  },
  // The note is on the declaration that moves, so it has to move too.
  {
    name: 'trailing comment on a misplaced type',
    code: "const value = 1;\n\ntype Alpha = 'a' | 'b'; // keep\n\ntype Bravo = number; // also keep\n",
    typescript: true,
  },
  {
    name: 'trailing comment on the statement a moved block anchors to',
    code: "import { thing } from 'mod'; // note\n\nconst value = thing;\n\ntype Alpha = string;\n",
    typescript: true,
  },
  // comment-delimiter declines all of these, so they pin where it stops.
  {
    name: 'three-line jsdoc stays JSDoc',
    code: '/**\n * alpha\n * bravo\n * charlie\n */\nconst value = 1;\n',
  },
  {
    name: 'two slash lines stay separate',
    code: '// alpha\n// bravo\nconst value = 1;\n',
  },
  // Every reader of a tagged block stops at `/**`, so none of these survives as `//`.
  {
    name: 'jsdoc type annotation on a config file',
    code: "/** @type {import('tailwindcss').Config} */\nmodule.exports = {};\n",
    filename: 'tailwind.config.cjs',
  },
  {
    name: 'jsx import source pragma',
    code: '/** @jsxImportSource @emotion/react */\nconst value = 1;\n',
    typescript: true,
    filename: 'styled.tsx',
  },
  {
    name: 'deprecated tag on one line',
    code: '/** @deprecated use `other` */\nexport const old = 1;\n',
  },
  // A literal `*/` in a merged line would close the block early.
  {
    name: 'run carrying a literal close-block sequence stays slash lines',
    code: '// alpha\n// bravo `*/` charlie\n// delta\nconst value = 1;\n',
  },
  {
    name: 'directive run stays machine-addressed',
    // No `eslint-disable`: ESLint's own fix pass deletes a directive that suppresses nothing.
    code: '// @ts-expect-error legacy\n// v8 ignore next\n// istanbul ignore next\nconst value = 1;\n',
    typescript: true,
  },
  {
    name: 'source map comment splits a comment run',
    code: '// alpha\n// bravo\n//# sourceMappingURL=out.js.map\n// charlie\n// delta\nconst value = 1;\n',
  },
  {
    name: 'shebang stays a hashbang',
    code: '#!/usr/bin/env node\nconst value = 1;\n',
  },
  {
    name: 'triple-slash reference stays a directive',
    code: '/// <reference lib="dom" />\nconst value = 1;\n',
    typescript: true,
  },
  {
    name: 'trailing slash note beside code',
    code: 'const value = 1; // why it is one\n',
  },
  {
    name: 'fluent chain, unawaited',
    code: 'function load() {\n  return fetch(url).then(parse).catch(handle);\n}',
  },
  {
    name: 'fluent chain, awaited',
    code: 'async function load() {\n  return await fetch(url).then(parse).catch(handle);\n}',
  },
  {
    name: 'chain returned from an async function',
    code: 'async function load() {\n  return fetch(url).catch(handle);\n}',
  },
  {
    name: 'chain at the top level',
    code: 'fetch(url).then(parse).catch(handle);',
  },
  {
    name: 'then with two arguments',
    code: 'function load() {\n  return fetch(url).then(parse, handle);\n}',
  },
  {
    name: 'then with three arguments',
    code: 'function load() {\n  return fetch(url).then(parse, handle, extra);\n}',
  },
  {
    name: 'catch with no argument',
    code: 'function load() {\n  return fetch(url).catch();\n}',
  },
  {
    name: 'chain on a member object',
    code: 'function load() {\n  return api.client.fetch(url).then(parse);\n}',
  },
  {
    name: 'computed promise method',
    code: 'const key = name;\nfunction load() {\n  return promise[key](parse);\n}',
  },
  {
    name: 'string-literal promise method',
    code: "function load() {\n  return promise['then'](parse);\n}",
  },
  {
    name: 'chain inside a constructor',
    code: 'class Service {\n  constructor() {\n    fetch(url).then(parse);\n  }\n}',
  },
  {
    name: 'chain inside a nested plain function',
    code: 'async function outer() {\n  function inner() {\n    return fetch(url).then(parse);\n  }\n'
      + '\n  return inner();\n}',
  },
  {
    name: 'chain yielded from a generator',
    code: 'function* walk() {\n  yield fetch(url).then(parse);\n}',
  },
  {
    name: 'chain in an arrow with an expression body',
    code: 'const load = () => fetch(url).then(parse);',
  },
  {
    name: 'chain in an async arrow with an expression body',
    code: 'const load = async () => fetch(url).then(parse);',
  },
  {
    name: 'then called bare',
    code: 'function load() {\n  return then(parse);\n}',
  },
  {
    name: 'chain assigned, not returned',
    code: 'function load() {\n  const pending = fetch(url).then(parse);\n  return pending;\n}',
  },
  {
    name: 'chain awaited mid-expression',
    code: 'async function load() {\n  return (await fetch(url)).then(parse);\n}',
  },
  {
    name: 'chain inside a class method',
    code: 'class Service {\n  load() {\n    return fetch(url).then(parse);\n  }\n}',
  },
  {
    name: 'chain inside a static block',
    code: 'class Service {\n  static {\n    fetch(url).then(parse);\n  }\n}',
  },
  // An optional chain puts a `ChainExpression` between the call and whatever awaits it.
  {
    name: 'optional chain returned from an async function',
    code: 'async function load() {\n  return api?.fetch(url).catch(handle);\n}',
  },
  {
    name: 'optional chain awaited',
    code: 'async function load() {\n  await api?.fetch(url).catch(handle);\n}',
  },

  // Nested: at the top level a fix landing at column 0 hides this defect.
  {
    name: 'partly wrapped destructuring inside a function',
    code: 'const run = () => {\n  const { alpha,\n    bravo, charlie } = source;\n};\n',
  },
  {
    name: 'partly wrapped array pattern inside a function',
    code: 'const run = () => {\n  const [alpha,\n    bravo, charlie] = source;\n};\n',
  },
  {
    name: 'wide destructuring inside a class method',
    code: 'class Service {\n  load() {\n    const { alpha, bravo, charlie, delta } = source;\n  }\n}\n',
  },
  {
    name: 'union inside a function body',
    code: 'const run = () => {\n  type Alpha = { first: string } | string | number;\n\n  return alpha;\n};\n',
    typescript: true,
  },

  // `.tsx`, so the parser reads angle brackets as JSX.
  {
    name: 'generic function in a tsx file',
    code: 'export function identity<T>(value: T): T {\n  return value;\n}\n',
    typescript: true,
    filename: 'sample.tsx',
  },
  {
    name: 'function expression inside a jsx expression container',
    code: 'const view = <Button onClick={function () {\n  run();\n}} />;\n',
    typescript: true,
    filename: 'sample.tsx',
  },

  {
    name: 'windows line endings, destructuring',
    code: 'const { alpha, bravo, charlie } = source;\r\nconst other = 1;\r\n',
    crlf: true,
  },
  {
    name: 'windows line endings, imports',
    code: "import { alpha, bravo, charlie } from 'mod';\r\nconst other = 1;\r\n",
    crlf: true,
  },
  {
    name: 'windows line endings, exports',
    code: "export { alpha, bravo } from 'mod';\r\nconst other = 1;\r\n",
    crlf: true,
  },
  {
    name: 'windows line endings, misplaced type',
    code: "import { thing } from 'mod';\r\nconst value = thing;\r\ninterface Shape {\r\n  alpha: string;\r\n}\r\n",
    typescript: true,
    crlf: true,
  },
  {
    name: 'windows line endings, union',
    code: 'type Alpha = { first: string } | string;\r\nconst other = 1;\r\n',
    typescript: true,
    crlf: true,
  },

  {
    name: 'vue <script setup lang="ts">',
    code: [
      '<script setup lang="ts">',
      "import { computed, ref } from 'vue';",
      "import type { Item } from './types';",
      '',
      'interface Props { items: Item[]; title?: string }',
      '',
      'type Mode = { kind: \'a\' } | { kind: \'b\' };',
      '',
      'const props = defineProps<Props>();',
      'const count = ref(0);',
      'const mode = ref<Mode>({ kind: \'a\' });',
      'function increment(step: number): void {',
      '  count.value += step;',
      '}',
      'const label = computed(function () {',
      "  return props.title ?? 'none';",
      '});',
      'const { items, title } = props;',
      '</script>',
      '',
      '<template>',
      '  <h1>{{ label }} {{ title }} {{ mode.kind }}</h1>',
      '  <button @click="increment(1)">{{ count }} of {{ items.length }}</button>',
      '</template>',
      '',
    ].join('\n'),
    filename: 'Counter.vue',
  },
  {
    name: 'vue <script> beside <script setup>',
    code: [
      '<script lang="ts">',
      "export default { name: 'Panel', inheritAttrs: false };",
      'export interface PanelSlot { header: string; body: string }',
      '</script>',
      '',
      '<script setup lang="ts">',
      "import { onMounted } from 'vue';",
      '',
      'onMounted(async function () {',
      "  await fetch('/ping').then(function (response) { return response.ok; });",
      '});',
      '</script>',
      '',
      '<template><div><slot /></div></template>',
      '',
    ].join('\n'),
    filename: 'Panel.vue',
  },
  {
    name: 'vue options api in plain javascript',
    code: [
      '<script>',
      "'use strict';",
      'export default {',
      '  data() { return { alpha: 1, bravo: 2 }; },',
      '  methods: { go: function () { return this.alpha; } },',
      '};',
      '</script>',
      '',
      '<template><p>{{ alpha }}</p></template>',
      '',
    ].join('\n'),
    filename: 'Legacy.vue',
  },
  {
    name: 'svelte module and instance scripts',
    code: [
      '<script context="module" lang="ts">',
      '  export interface Row { id: number; label: string }',
      '  export function rowsOf(count: number): Row[] {',
      '    return Array.from({ length: count }, function (_, id) {',
      '      return { id, label: String(id) };',
      '    });',
      '  }',
      '</script>',
      '',
      '<script lang="ts">',
      "  import { onMount } from 'svelte';",
      '  type Choice = { id: number } | null;',
      '  export let rows: Row[] = [];',
      '  let selected: Choice = null;',
      '  function select(id: number) {',
      '    selected = { id };',
      '  }',
      '  onMount(function () { select(0); });',
      '</script>',
      '',
      '{#each rows as row (row.id)}',
      '  <button on:click={function () { select(row.id); }}>{row.label} {selected?.id}</button>',
      '{/each}',
      '',
    ].join('\n'),
    filename: 'Rows.svelte',
  },
  {
    name: 'astro frontmatter',
    code: [
      '---',
      "import Layout from '../layouts/Layout.astro';",
      "import { format, trim } from '../lib/format';",
      '',
      'interface Props { title: string; items: string[] }',
      '',
      'type Size = { small: true } | { large: true };',
      '',
      'const { title, items } = Astro.props;',
      'const size: Size = { small: true };',
      'function shout(text: string): string {',
      '  return trim(text).toUpperCase();',
      '}',
      '---',
      '',
      '<Layout title={title}>',
      '  <ul data-size={JSON.stringify(size)}>',
      '    {items.map((item) => <li>{shout(format(item))}</li>)}',
      '  </ul>',
      '</Layout>',
      '',
    ].join('\n'),
    filename: 'index.astro',
  },
  // A fixer that writes at column 0 shows up in the indentation checks.
  {
    name: 'svelte script with a type after runtime code',
    code: [
      '<script lang="ts">',
      "  import { onMount } from 'svelte';",
      '',
      '  const count = 1;',
      '',
      '  interface Row { id: number }',
      '',
      '  onMount(() => count);',
      '</script>',
      '',
      '<p>{count}</p>',
      '',
    ].join('\n'),
    filename: 'Ordered.svelte',
  },
  {
    name: 'svelte script reaching through React',
    code: '<script lang="ts">\n  const state = React.useState(0);\n</script>\n\n<p>{state}</p>\n',
    filename: 'Reach.svelte',
  },
  {
    name: 'svelte template reaching through React',
    code: '<script lang="ts">\n  const label = 1;\n</script>\n\n<p>{React.version} {label}</p>\n',
    filename: 'Template.svelte',
  },
  {
    name: 'astro frontmatter reaching through React',
    code: [
      '---',
      "import Island from '../Island';",
      'const count = React.useMemo(() => 1, []);',
      '---',
      '',
      '<Island count={count} />',
      '',
    ].join('\n'),
    filename: 'reach.astro',
  },
  // A prologue is the one place a string statement means something.
  {
    name: 'nested prologue directives',
    code: "'use strict';\n\nfunction run() {\n  'use strict';\n  return 1;\n}\n\nmodule.exports = { run };\n",
    filename: 'directives.cjs',
  },
  {
    name: 'a server directive before a typed export',
    code: "'use server';\n\nexport async function act(input: { id: string }): Promise<void> {\n  await input;\n}\n",
    typescript: true,
    filename: 'actions.ts',
  },
  {
    name: 'a file that is only a directive',
    code: "'use client';\n",
    typescript: true,
    filename: 'client.ts',
  },
  ...['empty.js', 'empty.ts', 'Empty.vue', 'Empty.svelte', 'empty.astro']
    .map((filename) => {
      return {
        name: `an empty ${filename}`,
        code: '',
        typescript: filename.endsWith('.ts'),
        filename,
      };
    }),
  ...['notes.js', 'notes.ts']
    .map((filename) => {
      return {
        name: `a comment-only ${filename}`,
        code: '// one note\n/* and a block */\n',
        typescript: filename.endsWith('.ts'),
        filename,
      };
    }),
  {
    name: 'a comment-only vue script',
    code: '<script setup lang="ts">\n// nothing yet\n</script>\n',
    filename: 'Stub.vue',
  },
  {
    name: 'a comment-only svelte script',
    code: '<script lang="ts">\n  /* nothing yet */\n</script>\n',
    filename: 'Stub.svelte',
  },
  {
    name: 'a comment-only astro frontmatter',
    code: '---\n// nothing yet\n---\n',
    filename: 'stub.astro',
  },
  {
    // The StyleX compiler refuses a block body in a dynamic style.
    name: 'a StyleX dynamic style',
    code: "import * as stylex from '@stylexjs/stylex';\n\n"
      + 'export const sheet = stylex.create({\n  box: (width: number) => ({ width }),\n});\n',
    typescript: true,
    filename: 'styles.ts',
  },
  {
    // A break before `.` must not end a statement.
    name: 'chained calls without semicolons',
    code: 'const items = [3, 1, 2]\nconst joined = items.map((item) => {\n  return item * 2\n})'
      + '.filter(Boolean).join()\nconst fixed = 1 .toFixed(2).trim()\n',
  },
  {
    name: 'chained calls with a comment between links',
    code: "const items = [1];\nconst out = items /* keep */.map(String).join('');\n"
      + "const end = items.map(String) // end\n  .join('');\n",
  },
  {
    name: 'chained calls in a template literal and an optional chain',
    code: "const values = [1, 2];\nconst empty = null;\nconst text = `${values.map(String).join(', ')}`;\n"
      + "const none = empty?.map(String).join('');\n",
  },
  {
    name: 'chained calls under CRLF',
    code: "const rows = [1];\r\nconst out = rows.map(String).join('');\r\n",
    crlf: true,
  },
  {
    name: 'chained calls in an LF file with one CRLF line',
    code: "const rows = [1];\r\nconst out = rows.map(String).join('');\nconst other = 1;\n",
    strayCrlf: true,
  },
  {
    name: 'chained calls in a JSX attribute',
    code: "const rows = [1];\nexport const view = <List items={rows.map(String).join('')} />;\n",
    typescript: true,
    filename: 'view.tsx',
  },
  {
    name: 'chained calls in a svelte template',
    code: "<script>\n  const rows = [1, 2];\n</script>\n\n<p>{rows.map(String).join(', ')}</p>\n",
    filename: 'Chain.svelte',
  },
];

const linter = new Linter();

// ESLint reads a real `.cjs` as commonjs, which the repeated-parameter samples need.
const sourceTypeFor = (filename?: string): 'commonjs' | 'module' => {
  return filename?.endsWith('.cjs') ? 'commonjs' : 'module';
};

const SFC_EXTENSIONS = ['.vue', '.svelte', '.astro'];

const SFC_PARSERS: [string, Linter.Parser][] = [
  ['.vue', vueParser],
  ['.svelte', svelteParser],
  ['.astro', astroParser],
];

const sfcParserFor = (filename?: string): Linter.Parser | undefined => {
  return SFC_PARSERS
    .find(([extension]) => {
      return filename?.endsWith(extension) ?? false;
    })?.[1];
};

// The component parsers nest typescript-eslint for the script inside, which reads plain JavaScript as well.
const languageOptionsFor = ({ typescript, filename }: Pick<FixerSample, 'filename' | 'typescript'>) => {
  const sfc = sfcParserFor(filename);

  if (sfc !== undefined) {
    return {
      parser: sfc,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: SFC_EXTENSIONS,
        sourceType: 'module' as const,
      },
    };
  }

  return typescript
    ? { parser: tseslint.parser }
    : {
        ecmaVersion: 'latest' as const,
        sourceType: sourceTypeFor(filename),
      };
};

const filesFor = (filename?: string) => {
  return filename ? { files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue,svelte,astro}'] } : {};
};

export const isSfcSample = (sample: FixerSample): boolean => {
  return sfcParserFor(sample.filename) !== undefined;
};

export const parseErrorsIn = (code: string, typescript = false, filename?: string): string[] => {
  return linter
    .verify(code, [{
      ...filesFor(filename),
      languageOptions: languageOptionsFor({
        typescript,
        filename,
      }),
    }], filename)
    .filter((message) => {
      return message.fatal;
    })
    .map((message) => {
      return message.message;
    });
};

// No public constructor, so a throwaway rule captures the parsed result.
const astOf = (code: string, typescript: boolean, filename?: string): AST.Program => {
  let captured: SourceCode | undefined;

  const probe: Rule.RuleModule = {
    create: (context) => {
      captured = context.sourceCode;

      return {};
    },
  };

  linter.verify(code, [{
    ...filesFor(filename),
    plugins: { probe: { rules: { capture: probe } } },
    languageOptions: languageOptionsFor({
      typescript,
      filename,
    }),
    rules: { 'probe/capture': 'error' },
  }], filename);

  if (!captured) {
    throw new Error(`snippet did not parse: ${code}`);
  }

  return captured.ast;
};

export const alphabetically = (left: string, right: string): number => {
  return left.localeCompare(right);
};

const CLOSERS = new Set([')', '}', ']', '>']);

export const tokensIn = (code: string, typescript = false, filename?: string): string[] => {
  const { tokens } = astOf(code, typescript, filename);

  return tokens
    .filter((token, index) => {
    // `at`: ESLint's `Token[]` is typed as if every index were populated.
      const next = tokens.at(index + 1);

      return !(token.value === ',' && next && CLOSERS.has(next.value));
    })
    .map((token) => {
      return `${token.type} ${token.value}`;
    });
};

const OPENERS = new Set(['(', '{', '[']);
const BRACKET_CLOSERS = new Set([')', '}', ']']);

// Only punctuators count: a template's `${` is part of its template token.
export const openerLinesIn = (code: string, typescript = false, filename?: string): (number | undefined)[] => {
  const brackets = astOf(code, typescript, filename).tokens
    .filter((token) => {
      return token.type === 'Punctuator' && (OPENERS.has(token.value) || BRACKET_CLOSERS.has(token.value));
    });
  const lineCount = code.split('\n').length;
  const openers: (number | undefined)[] = [];
  const open: number[] = [];

  const recordThrough = (line: number): void => {
    while (openers.length <= line) {
      openers.push(open.at(-1));
    }
  };

  for (const token of brackets) {
    const line = token.loc.start.line - 1;

    recordThrough(line);

    if (OPENERS.has(token.value)) {
      open.push(line);
    }
    else {
      open.pop();
    }
  }

  recordThrough(lineCount - 1);

  return openers;
};

// Counting `//` cannot tell one note from two sharing a line.
export const commentsIn = (code: string, typescript = false, filename?: string): string[] => {
  return astOf(code, typescript, filename).comments
    .map((comment) => {
      return `${comment.type} ${JSON.stringify(comment.value)}`;
    })
    .sort(alphabetically);
};

export const fixWith = (sample: FixerSample, ruleName?: string): string => {
  // Filtered rather than looked up, which would need a cast to prove the key.
  const selected = Object.entries(rules)
    .filter(([name]) => {
      return ruleName === undefined || name === ruleName;
    });

  const active = Object.fromEntries(selected);
  const enabled = Object.keys(active);

  return linter.verifyAndFix(sample.code, [
    {
      ...filesFor(sample.filename),
      plugins: { '@linteljs': { rules: active } },
      languageOptions: languageOptionsFor(sample),
      rules: Object.fromEntries(enabled
        .map((name) => {
          return [`@linteljs/${name}`, 'error' as const];
        })),
    },
  ], sample.filename).output;
};

// A `.cjs` runs as written: the transpiler would add the `'use strict'` its samples exist to be without.
export const runtimeErrorIn = (code: string, filename = ''): string | undefined => {
  const script = filename.endsWith('.cjs')
    ? code
    : ts.transpileModule(code, {
      fileName: filename.endsWith('x') ? 'sample.tsx' : 'sample.ts',
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
  const module = { exports: {} };

  try {
    runInNewContext(script, {
      module,
      exports: module.exports,
    }, { timeout: 1000 });

    return undefined;
  }
  catch (error) {
    return String(error);
  }
};

export const parseableSamples = (): FixerSample[] => {
  return FIXER_SAMPLES
    .filter((sample) => {
      return parseErrorsIn(sample.code, sample.typescript ?? false, sample.filename).length === 0;
    });
};
