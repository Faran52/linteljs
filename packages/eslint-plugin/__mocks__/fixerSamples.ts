import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { rules } from '../src/rules/index.ts';

import type {
  AST,
  Rule,
  SourceCode,
} from 'eslint';

// A corpus aimed at fixers: a rule's own suite pins what its fix produces, not that the result parses.
export interface FixerSample {
  name: string;
  code: string;
  typescript?: boolean | undefined;
  // Without one every snippet is called `<input>`, so `physicalFilenameOf` never sees a `.tsx`
  // and JSX never kicks in.
  filename?: string | undefined;
  // Declared, not sniffed out of the text, so the CRLF set is a decision.
  crlf?: true;
}

export const FIXER_SAMPLES: FixerSample[] = [
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
  // The `?` sits inside the `ObjectPattern`, between its closing brace and the
  // annotation; a pattern rebuild can drop it and still parse.
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
  // The callee is still a callee here; `() => {}()` does not parse.
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
  // Crockford's spelling, parentheses around the call rather than the function;
  // same nodes as `(function () {})(1)`, and only one can take an arrow.
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
  // Only a sloppy function with a simple parameter list may repeat a name; an
  // arrow never may, so this has to be linted as `.cjs`.
  {
    name: 'duplicate parameter name in a sloppy function',
    code: 'function parseAdvanced(source, parse, _, _, tokenizers) {\n  return source;\n}\n',
    filename: 'sample.cjs',
  },
  // Annex B: a sloppy-mode function declaration is legal as an if/else body
  // and as a labelled statement; const is legal in neither.
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

  {
    name: 'hook dependencies with a comment',
    code: 'useEffect(() => {}, [\n  bravo, // needed\n  alpha,\n]);',
  },

  {
    name: 'union with a comment before the pipe',
    code: 'type Alpha = { first: string } /* keep */ | string;',
    typescript: true,
  },
  // A note between the last member and the closing brace: the one gap a member split rewrites wholesale.
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
  // The note is on the declaration that moves, so it has to move too or it
  // ends up documenting whatever slides under it.
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
  // comment-delimiter declines all of these, so they pin where it stops rather than what it rewrites;
  // a delimiter conversion changes a comment's type, which the corpus's comment checks cannot absorb.
  {
    name: 'three-line jsdoc stays JSDoc',
    code: '/**\n * alpha\n * bravo\n * charlie\n */\nconst value = 1;\n',
  },
  {
    name: 'two slash lines stay separate',
    code: '// alpha\n// bravo\nconst value = 1;\n',
  },
  // A three-line run merges into one `/** */` block; if a line already carries a literal `*/`, merging it would
  // close that block early and spill the rest of the run as code.
  {
    name: 'run carrying a literal close-block sequence stays slash lines',
    code: '// alpha\n// bravo `*/` charlie\n// delta\nconst value = 1;\n',
  },
  {
    name: 'directive run stays machine-addressed',
    // No `eslint-disable` here: ESLint's own fix pass deletes a disable directive that suppresses nothing,
    // which drops a comment for reasons that have nothing to do with the rule under test.
    code: '// @ts-expect-error legacy\n// v8 ignore next\n// istanbul ignore next\nconst value = 1;\n',
    typescript: true,
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
  // An optional chain puts a `ChainExpression` between the outermost call and
  // whatever awaits it; that is the position both promise rules read.
  {
    name: 'optional chain returned from an async function',
    code: 'async function load() {\n  return api?.fetch(url).catch(handle);\n}',
  },
  {
    name: 'optional chain awaited',
    code: 'async function load() {\n  await api?.fetch(url).catch(handle);\n}',
  },

  // Nested constructs: at the top level a fix that lands at column 0 lands
  // where it belongs anyway, hiding this shape of defect.
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

  // `.tsx`, so the parser reads angle brackets as JSX; neither is true of a snippet linted as `<input>`.
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
];

const linter = new Linter();

// Strict mode rules out a repeated parameter name, which this corpus holds; ESLint reads a real `.cjs` as commonjs.
const sourceTypeFor = (filename?: string): 'commonjs' | 'module' => {
  return filename?.endsWith('.cjs') ? 'commonjs' : 'module';
};

const languageOptionsFor = ({ typescript, filename }: Pick<FixerSample, 'filename' | 'typescript'>) => {
  return typescript
    ? { parser: tseslint.parser }
    : {
        ecmaVersion: 'latest' as const,
        sourceType: sourceTypeFor(filename),
      };
};

// A named sample opts itself in via `files`; an unnamed one is linted as
// `<input>`, matching no pattern and getting nothing.
const filesFor = (filename?: string) => {
  return filename ? { files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'] } : {};
};

// Parse errors in a snippet, so a fixer's output can be checked for validity.
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

// The same trick `sourceCodeFrom` uses: there is no public constructor, so a throwaway rule captures the parsed result.
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

// For the multiset comparisons: order is meaningless, it only has to be stable.
export const alphabetically = (left: string, right: string): number => {
  return left.localeCompare(right);
};

const CLOSERS = new Set([')', '}', ']', '>']);

// The tokens of a snippet, minus a trailing comma that a closer follows,
// which is what these fixers collapse onto one line.
export const tokensIn = (code: string, typescript = false, filename?: string): string[] => {
  const { tokens } = astOf(code, typescript, filename);

  return tokens.filter((token, index) => {
    // `at`, not an index read: the last token has no next, but ESLint's
    // `Token[]` is typed as if every index were populated.
    const next = tokens.at(index + 1);

    return !(token.value === ',' && next && CLOSERS.has(next.value));
  }).map((token) => {
    return `${token.type} ${token.value}`;
  });
};

// Each comment as its own text, sorted; counting `//` occurrences cannot tell one note from two sharing a line.
export const commentsIn = (code: string, typescript = false, filename?: string): string[] => {
  return astOf(code, typescript, filename).comments.map((comment) => {
    return `${comment.type} ${JSON.stringify(comment.value)}`;
  }).sort(alphabetically);
};

// Runs `--fix` to completion with one rule, or the whole plugin when omitted.
export const fixWith = (sample: FixerSample, ruleName?: string): string => {
  // Filtered out of the registry rather than looked up by name, which would need a cast to prove the key existed.
  const active = Object.fromEntries(Object.entries(rules).filter(([name]) => {
    return ruleName === undefined || name === ruleName;
  }));
  const enabled = Object.keys(active);

  return linter.verifyAndFix(sample.code, [
    {
      ...filesFor(sample.filename),
      plugins: { '@linteljs': { rules: active } },
      languageOptions: languageOptionsFor(sample),
      rules: Object.fromEntries(enabled.map((name) => {
        return [`@linteljs/${name}`, 'error' as const];
      })),
    },
  ], sample.filename).output;
};

// Samples the given parser accepts, so a fixture never fails on its own input.
export const parseableSamples = (): FixerSample[] => {
  return FIXER_SAMPLES.filter((sample) => {
    return parseErrorsIn(sample.code, sample.typescript ?? false, sample.filename).length === 0;
  });
};
