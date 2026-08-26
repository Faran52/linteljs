/**
 * Runs every fixer in this plugin over real third-party code and checks that what comes back is still the same
 * program. The unit suite and the mutation gate are both measured against `__mocks__/fixerSamples.ts`, a corpus
 * we wrote, so it only holds the shapes we thought of. Every defect found in this plugin so far came from
 * something that took our imagination out of the loop: `--fix` on this repo, the packed artifact on old Node,
 * mutation testing. This is the same trick pointed at code nobody here wrote.
 *
 * Nothing is written back. The fixed text lives in memory and is compared with its input on six properties: it
 * parses, a second pass changes nothing, no token is lost or altered, no comment is lost, no comment ends up
 * written against different code, and the line endings survive. TypeScript and JavaScript are both walked and
 * reported separately: nine of the eleven rules declare `language: 'universal'` and ship on for `.js` in the
 * recommended preset, so evidence gathered on `.ts` alone covers the rules with the widest reach on the file
 * type most projects have least of.
 *
 * Two extra passes run alongside the fixers, because the six properties above only prove a fix is
 * non-destructive, never that it is right:
 *
 *   - Every function `prefer-arrow-functions` offers to convert is re-read in the *original* source and checked
 *     for the things an arrow rebinds: `this`, `arguments`, `new.target`, `super`, and a call above its own
 *     declaration. Those are the rule's own guards, checked here against an independent reading of the AST.
 *   - The three report-only rules emit no fix, so nothing above exercises them at all. Each report is matched
 *     against the shape the rule claims to have found, derived from the AST rather than from the rule.
 *
 * Sources are directories given on the command line, or a default list of whatever real code is already on this
 * machine. For more volume, clone a few repositories into `<tmpdir>/lintel-real-code` first, which is on the
 * default list:
 *
 *   git clone --depth 1 https://github.com/colinhacks/zod "$TMPDIR/lintel-real-code/zod"
 *
 * Two things are measured alongside the properties, because a published rule can be correct and still be a bug
 * report:
 *
 *   - How long the `--fix` pass takes on each file, so a rule that is accidentally superlinear shows up as time
 *     per byte climbing with size rather than as a complaint from someone with a large file.
 *   - `--options` re-runs the same six properties under every configuration the rules declare, derived from
 *     `meta.schema` rather than listed by hand. Everything else here runs at default options, so an option that
 *     produces a broken fix has nothing else looking for it.
 *
 * Usage: node scripts/fixRealCode.js [dir...] [--rule <rule-id>] [--max-files <n>]
 *          [--options]
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import {
  extname,
  join,
  resolve,
} from 'node:path';
// Imported rather than taken off the global, which ESLint's Node environment does not declare for a `.js` script.
import { performance } from 'node:perf_hooks';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { rules } from '../src/rules/index.ts';

const root = resolve(import.meta.dirname, '..');
const linter = new Linter();

// espree is ESLint's own parser and ships inside it, so reading JavaScript the way ESLint reads it costs no
// dependency. Resolved through ESLint because pnpm does not hoist a transitive dependency to the top level.
const espree = createRequire(createRequire(import.meta.url).resolve('eslint'))('espree');

const ALL_RULES = Object.keys(rules);

// Fixers that may only insert or remove whitespace, so token order holds.
const ORDERED_RULES = [
  'destructuring-property-newline',
  'export-specifier-newline',
  'import-newlines',
  'newline-destructuring',
  'union-newline',
];

// Those, plus the two that may move a member: same tokens, different order.
const MOVE_RULES = [...ORDERED_RULES, 'interface-order', 'sort-hook-dependencies'];

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'coverage', '.git', '.stryker-tmp']);

const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.tsx']);
const JAVASCRIPT_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs']);

// Large enough for any hand-written module. Above it are bundled `.d.ts` blobs
// that cost seconds each to parse and say nothing a smaller file does not.
const MAX_BYTES = 512 * 1024;

// A hand-written line does not run past this. Anything that does is a bundle carrying enough short lines to slip
// under the average below, which is common in `node_modules` and says nothing about real code.
const MAX_LINE = 1000;

const args = process.argv.slice(2);
const ruleFlag = args.indexOf('--rule');
const onlyRule = ruleFlag === -1 ? undefined : args[ruleFlag + 1];
const activeRules = onlyRule ? [onlyRule] : ALL_RULES;

const limitFlag = args.indexOf('--max-files');
const optionsMode = args.includes('--options');

// A configuration sweep pays for the corpus once per configuration, so it
// samples rather than reading everything. Stated in the header either way.
const DEFAULT_OPTION_FILES = 2000;

const sweepDefault = optionsMode ? DEFAULT_OPTION_FILES : Infinity;
const maxFiles = limitFlag === -1 ? sweepDefault : Number(args[limitFlag + 1]);

if (onlyRule && !ALL_RULES.includes(onlyRule)) {
  console.error(`unknown rule: ${onlyRule}\nknown: ${ALL_RULES.join(', ')}`);
  process.exit(2);
}

// The index after each flag that was actually given, so a flag's value is not
// mistaken for a source directory. `-1 + 1` would swallow the first argument.
const valueFlags = new Set([ruleFlag, limitFlag].filter((index) => {
  return index !== -1;
}).map((index) => {
  return index + 1;
}));

const given = args.filter((arg, index) => {
  return !arg.startsWith('--') && !valueFlags.has(index);
});

const sources = (given.length > 0
  ? given
  : [
      // The workspace store, not `packages/eslint-plugin/node_modules`: pnpm fills that one with symlinks, which `walk`
      // skips to keep directory cycles out, so it contributes nothing. Two levels up is the real third-party code.
      join(root, '..', '..', 'node_modules'),
      join(homedir(), 'Projects'),
      join(tmpdir(), 'lintel-real-code'),
    ]).map((dir) => {
  return resolve(dir);
}).filter(existsSync);

if (sources.length === 0) {
  console.error('no source directories found');
  process.exit(2);
}

const isScript = (name) => {
  const extension = extname(name);

  return TYPESCRIPT_EXTENSIONS.has(extension) || JAVASCRIPT_EXTENSIONS.has(extension);
};

const walk = (dir, keepNodeModules, found) => {
  let entries;

  try {
    entries = readdirSync(dir, { withFileTypes: true });
  }
  catch {
    // An unreadable directory on someone's machine is not a finding.
    return found;
  }

  for (const entry of entries) {
    const full = join(dir, entry.name);

    // Symlinks report as neither, which is how directory cycles stay out.
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) || (keepNodeModules && entry.name === 'node_modules')) {
        walk(full, keepNodeModules, found);
      }
    }
    // `.min.js` is minified by name. The content heuristics catch most of it
    // anyway, but reading a megabyte to decide that is wasted work.
    else if (entry.isFile() && !entry.name.includes('.min.') && isScript(entry.name)) {
      found.push(full);
    }
  }

  return found;
};

const configCache = new Map();

// The options every config built below carries, by rule id. A module-level switch, not a parameter: threading it
// through eight uninterested functions buys nothing, and only one is ever live since the passes are sequential.
let currentOptions = {};

// JSX is on for every JavaScript file rather than gated on a `.jsx` name,
// because the only thing the synthetic name has to decide is `sourceType`.
const JSX_ON = { ecmaFeatures: { jsx: true } };

/**
 * The config shape from `__mocks__/fixerSamples.ts`, plus a `files` pattern. A flat config only applies to a named
 * file if the pattern matches, and the name is what tells the parser to accept JSX, so `.tsx` needs both. Two
 * entries, one per language: JavaScript is left on ESLint's own default parser, since espree is what a consumer
 * linting `.js` will actually be running, and typescript-eslint accepts syntax espree rejects, so borrowing it
 * here would test a parser nobody uses on those files.
 */
const configFor = (names) => {
  const key = `${names.join(',')}|${JSON.stringify(currentOptions)}`;
  const cached = configCache.get(key);

  if (cached) {
    return cached;
  }

  const shared = {
    // ESLint 9 deletes an `eslint-disable` comment for a rule it does not have loaded, and every file here
    // disables rules this config never registers. Left on, the harness eats comments and blames the plugin.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    plugins: {
      // The key every rule below is named under. Registering it as anything else makes ESLint reject the whole
      // config with "Could not find plugin", which reads as the corpus throwing rather than as a harness typo.
      '@linteljs': {
        rules: Object.fromEntries(names.map((name) => {
          return [name, rules[name]];
        })),
      },
    },
    rules: Object.fromEntries(names.map((name) => {
      const options = currentOptions[name];

      return [`@linteljs/${name}`, options ? ['error', options] : 'error'];
    })),
  };

  const config = [
    {
      ...shared,
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: { parser: tseslint.parser },
    },
    {
      ...shared,
      files: ['**/*.js', '**/*.cjs'],
      languageOptions: { parserOptions: JSX_ON },
    },
  ];

  configCache.set(key, config);

  return config;
};

/**
 * How long the first `fix` of the current file took, or `undefined` before it has run. That first call is the
 * whole-plugin pass a consumer pays for; every later call on the same file is this harness attributing a finding,
 * which nobody else does and which only happens on a file that already failed.
 */
let firstFixMs;

const fix = (source, name, names) => {
  const started = performance.now();
  const { output } = linter.verifyAndFix(source, configFor(names), name);

  firstFixMs ??= performance.now() - started;

  return output;
};

const isTypeScript = (name) => {
  return name === 'file.ts' || name === 'file.tsx';
};

// What ESLint's own defaults hand espree, spelled out because the harness
// parses directly as well as through the Linter and the two must agree.
const JS_PARSE = {
  ...JSX_ON,
  comment: true,
  ecmaVersion: 'latest',
  loc: true,
  range: true,
  tokens: true,
};

const parse = (source, name) => {
  if (isTypeScript(name)) {
    return tseslint.parser.parseForESLint(source, { filePath: name }).ast;
  }

  // Flat config reads `.cjs` as `commonjs` and everything else as `module`,
  // which is the only thing the synthetic JavaScript name carries.
  return espree.parse(source, {
    ...JS_PARSE,
    sourceType: name === 'file.cjs' ? 'commonjs' : 'module',
  });
};

const parseOrNull = (source, name) => {
  try {
    return parse(source, name);
  }
  catch {
    return null;
  }
};

const describe = (token) => {
  return `${token.type} ${JSON.stringify(token.value)}`;
};

const CLOSERS = new Set([')', '}', ']', '>']);

/**
 * Trailing commas, dropped. Collapsing a list onto one line takes the trailing comma with it, which is what these
 * fixers are for and changes nothing about the program. A comma between two members cannot go missing quietly:
 * the result would not parse, and that is checked first.
 */
const comparable = (tokens) => {
  return tokens.filter((token, index) => {
    const next = tokens[index + 1];

    return !(token.value === ',' && next && CLOSERS.has(next.value));
  });
};

const orderedDiff = (beforeTokens, afterTokens) => {
  const before = comparable(beforeTokens);
  const after = comparable(afterTokens);

  for (let index = 0; index < before.length; index++) {
    const original = before[index];
    const produced = after[index];

    if (!produced) {
      return `output ends after ${after.length} tokens, input had ${before.length}, `
        + `first missing ${describe(original)}`;
    }

    if (original.type !== produced.type || original.value !== produced.value) {
      return `token ${index} was ${describe(original)} and is now ${describe(produced)}`;
    }
  }

  return undefined;
};

const tally = (items, keyOf) => {
  const counts = new Map();

  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
};

// Order-blind: what is left after a rule that is allowed to move members.
const missingFrom = (before, after, keyOf, noun) => {
  const produced = tally(after, keyOf);

  for (const [key, count] of tally(before, keyOf)) {
    const kept = produced.get(key) ?? 0;

    if (kept < count) {
      return `${noun} ${key} appears ${count} time(s) in the input and ${kept} in the output`;
    }
  }

  return undefined;
};

const multisetDiff = (before, after) => {
  return missingFrom(comparable(before), comparable(after), describe, 'token');
};

const commentDiff = (before, after) => {
  return missingFrom(before, after, (comment) => {
    return `${comment.type} ${JSON.stringify(comment.value)}`;
  }, 'comment');
};

// A note cannot be written against an opening bracket, so one that follows a
// brace on the same line heads whatever comes after it instead.
const OPENERS = new Set(['{', '(', '[']);

/**
 * The nearest name in one direction, which is what a comment is written about. The adjacent token is the wrong
 * thing to hold on to: `prefer-arrow-functions` turns `function foo` into `const foo`, so a doc comment above it
 * keeps its place while the token under it changes. A name survives that rewrite, and every rule here leaves
 * names alone.
 */
const nameBefore = (tokens, from) => {
  for (let index = from; index >= 0; index--) {
    if (tokens[index].type === 'Identifier') {
      return tokens[index];
    }
  }

  return undefined;
};

const BLOCK_CLOSERS = new Set(['}', ')', ']']);

/**
 * The name a comment heads, or nothing if it heads no more of the block. The search stops at a closing bracket: a
 * note written last inside a block has the next construct's names after it, and reading one of those made a
 * dependency array sorted by `sort-hook-dependencies` look like a note that had moved, when what moved was the
 * code two lines below it.
 */
const nameAfter = (tokens, from) => {
  for (let index = from; index < tokens.length; index++) {
    if (BLOCK_CLOSERS.has(tokens[index].value)) {
      return undefined;
    }

    if (tokens[index].type === 'Identifier') {
      return tokens[index];
    }
  }

  return undefined;
};

/**
 * What each comment is written against, keyed so it can be tallied. `commentDiff` above keys on the text alone,
 * so a comment that moves reads as one that stayed and every check here is blind to it. That is how
 * `newline-destructuring` shipped a fix in 1.0.1 that walked every trailing note down onto the field below,
 * relabelling all of them: nothing was deleted, so nothing complained.
 *
 * Code before a note on its own line is what the note annotates; otherwise it annotates what follows, and only
 * the side that holds it goes into the key. Taking the far side too would report `interface-order` for moving a
 * declaration, since the note travels with it and its other neighbour changes.
 */
const commentAnchors = (tokens, comments) => {
  const keys = [];
  // Both lists are in source order, so the search for the token after each
  // comment carries on from where the previous one stopped.
  let index = 0;

  for (const comment of comments) {
    while (index < tokens.length && tokens[index].range[1] <= comment.range[0]) {
      index++;
    }

    const previous = tokens[index - 1];
    const trails = previous
      && previous.loc.end.line === comment.loc.start.line
      && !OPENERS.has(previous.value);
    // A note that heads nothing left in its block is read as trailing what
    // came before it, which is the only other thing it can be about.
    const heads = trails ? undefined : nameAfter(tokens, index);
    const anchor = heads ?? nameBefore(tokens, index - 1);
    const side = heads ? 'before' : 'after';

    keys.push(`${JSON.stringify(comment.value)} written ${side} ${anchor ? describe(anchor) : 'no name'}`);
  }

  return keys;
};

const commentMoveDiff = (before, after) => {
  return missingFrom(
    commentAnchors(before.tokens, before.comments),
    commentAnchors(after.tokens, after.comments),
    (key) => {
      return key;
    },
    'comment',
  );
};

const countMatches = (text, pattern) => {
  return (text.match(pattern) ?? []).length;
};

const endingsDiff = (source, fixed) => {
  const bareBefore = countMatches(source, /(?<!\r)\n/g);
  const bareAfter = countMatches(fixed, /(?<!\r)\n/g);
  const crlfBefore = countMatches(source, /\r\n/g);
  const crlfAfter = countMatches(fixed, /\r\n/g);

  if (crlfBefore > 0 && bareAfter > bareBefore) {
    return `CRLF file gained ${bareAfter - bareBefore} bare LF line ending(s)`;
  }

  if (crlfBefore === 0 && crlfAfter > 0) {
    return `LF file gained ${crlfAfter} CRLF line ending(s)`;
  }

  return undefined;
};

const message = (error) => {
  return String(error?.message ?? error).split('\n')[0].slice(0, 160);
};

// Does this subset alone break the property it is supposed to hold?
const breaks = (source, tokens, name, names, diff) => {
  if (names.length === 0) {
    return undefined;
  }

  const fixed = fix(source, name, names);

  if (fixed === source) {
    return undefined;
  }

  const after = parseOrNull(fixed, name);

  // Unparseable output is a finding in its own right and is reported there.
  return after ? diff(tokens, after.tokens) : undefined;
};

// A changed token stream from the full set proves nothing on its own: `prefer-arrow-functions` rewrites syntax, and two
// rules reorder members. So re-run the subsets that do promise to keep it intact, and report whichever breaks it.
const attributeTokens = (source, tokens, name, names) => {
  const scopes = [
    {
      diff: orderedDiff,
      subset: ORDERED_RULES.filter((rule) => {
        return names.includes(rule);
      }),
    },
    {
      diff: multisetDiff,
      subset: MOVE_RULES.filter((rule) => {
        return names.includes(rule);
      }),
    },
  ];

  for (const { diff, subset } of scopes) {
    const detail = breaks(source, tokens, name, subset, diff);

    if (!detail) {
      continue;
    }

    const culprits = subset.filter((rule) => {
      return breaks(source, tokens, name, [rule], diff);
    });

    return {
      category: 'token loss',
      rules: culprits.length > 0 ? culprits : subset,
      detail,
    };
  }

  return undefined;
};

const movesAComment = (source, ast, name, names) => {
  if (names.length === 0) {
    return undefined;
  }

  const fixed = fix(source, name, names);

  if (fixed === source) {
    return undefined;
  }

  const after = parseOrNull(fixed, name);

  return after ? commentMoveDiff(ast, after) : undefined;
};

/**
 * A comment sitting next to a different name proves nothing from the full set, for the same reason a changed
 * token stream does not. `prefer-arrow-functions` writes `const` where `function` was, moves `async` to the far
 * side of the name, and drops a function expression's name outright, so the nearest name to a comment it never
 * touched is a different one afterwards. Only the fixers that promise to touch whitespace alone are asked.
 */
const attributeCommentMoves = (source, ast, name, names) => {
  const subset = ORDERED_RULES.filter((rule) => {
    return names.includes(rule);
  });

  const detail = movesAComment(source, ast, name, subset);

  if (!detail) {
    return undefined;
  }

  const culprits = subset.filter((rule) => {
    return movesAComment(source, ast, name, [rule]);
  });

  return {
    category: 'comment moved',
    rules: culprits.length > 0 ? culprits : subset,
    detail,
  };
};

const inspect = (source, ast, fixed, name, names) => {
  const after = parseOrNull(fixed, name);

  if (!after) {
    let detail = 'output does not parse';

    try {
      parse(fixed, name);
    }
    catch (error) {
      detail = message(error);
    }

    return [{
      category: 'unparseable',
      rules: names,
      detail,
    }];
  }

  const findings = [];

  if (fix(fixed, name, names) !== fixed) {
    findings.push({
      category: 'non-convergent',
      rules: names,
      detail: 'a second --fix pass changed it again',
    });
  }

  if (orderedDiff(ast.tokens, after.tokens)) {
    const token = attributeTokens(source, ast.tokens, name, names);

    if (token) {
      findings.push(token);
    }
  }

  const comments = commentDiff(ast.comments, after.comments);

  if (comments) {
    findings.push({
      category: 'comment loss',
      rules: names,
      detail: comments,
    });
  }

  if (commentMoveDiff(ast, after)) {
    const moved = attributeCommentMoves(source, ast, name, names);

    if (moved) {
      findings.push(moved);
    }
  }

  const endings = endingsDiff(source, fixed);

  if (endings) {
    findings.push({
      category: 'line-ending change',
      rules: names,
      detail: endings,
    });
  }

  return findings;
};

// `parsed` lets a caller that already has the AST hand it over. The full run
// parses every file once for the audit pass and would otherwise pay twice.
const evaluate = (source, name, names, parsed) => {
  const ast = parsed ?? parseOrNull(source, name);

  if (!ast) {
    return {
      parsed: false,
      changed: false,
      findings: [],
    };
  }

  const fixed = fix(source, name, names);

  if (fixed === source) {
    return {
      parsed: true,
      changed: false,
      findings: [],
    };
  }

  return {
    parsed: true,
    changed: true,
    fixed,
    findings: inspect(source, ast, fixed, name, names),
  };
};

const linesBefore = (text, offset) => {
  return countMatches(text.slice(0, offset), /\n/g);
};

const changedLines = (source, fixed) => {
  let start = 0;

  while (start < source.length && source[start] === fixed[start]) {
    start += 1;
  }

  let back = 0;

  while (back < source.length - start && back < fixed.length - start
    && source[source.length - 1 - back] === fixed[fixed.length - 1 - back]) {
    back += 1;
  }

  return {
    first: linesBefore(source, start),
    last: linesBefore(source, source.length - back),
  };
};

// The smallest slice of the file that still shows the same category. Widening from the changed lines outwards,
// because a two-line slice usually will not parse on its own once it sits inside a class or a function.
const narrow = (source, fixed, name, finding) => {
  const lines = source.split('\n');
  const { first, last } = changedLines(source, fixed);

  for (const pad of [0, 1, 2, 4, 8, 16, 32]) {
    const from = Math.max(0, first - pad);
    const to = Math.min(lines.length, last + pad + 1);
    const slice = `${lines.slice(from, to).join('\n')}\n`;
    const result = evaluate(slice, name, finding.rules);

    if (result.findings.some((candidate) => {
      return candidate.category === finding.category;
    })) {
      return {
        snippet: slice,
        narrowed: true,
      };
    }
  }

  const from = Math.max(0, first - 3);
  const to = Math.min(lines.length, last + 4);

  return {
    snippet: `${lines.slice(from, to).join('\n')}\n`,
    narrowed: false,
  };
};

const attribute = (source, name, names, category) => {
  return names.filter((rule) => {
    return evaluate(source, name, [rule]).findings.some((finding) => {
      return finding.category === category;
    });
  });
};

const flavourOf = (file) => {
  return TYPESCRIPT_EXTENSIONS.has(extname(file)) ? 'ts' : 'js';
};

/**
 * The name the file is linted under, which is not its own. TypeScript needs `.tsx` to unlock JSX; JavaScript
 * needs nothing but a `sourceType`, and a `.js` file on disk could be either, since `node_modules` is full of
 * CommonJS that is not valid as a module, top-level `return` in a UMD wrapper being the usual reason. Probing
 * settles it once, and every later pass reads the answer back off the name.
 */
const nameFor = (file, source) => {
  const extension = extname(file);

  if (TYPESCRIPT_EXTENSIONS.has(extension)) {
    return extension === '.tsx' ? 'file.tsx' : 'file.ts';
  }

  if (extension === '.cjs') {
    return 'file.cjs';
  }

  if (extension === '.mjs') {
    return 'file.js';
  }

  return parseOrNull(source, 'file.js') ? 'file.js' : 'file.cjs';
};

const longestLine = (source) => {
  return source.split('\n').reduce((longest, line) => {
    return Math.max(longest, line.length);
  }, 0);
};

// Why this file is not worth reading, or `undefined` if it is.
const skipReason = (source) => {
  if (source.length > MAX_BYTES) {
    return 'oversized';
  }

  if (source.includes('sourceMappingURL')) {
    return 'compiled';
  }

  const lines = countMatches(source, /\n/g) + 1;

  return source.length / lines > 200 || longestLine(source) > MAX_LINE ? 'minified' : undefined;
};

// -------------------------------------------------------------------- timing

// One `{ bytes, file, ms }` per linted file, for the whole-plugin fix pass.
const timings = [];

/**
 * Below either of these a time-per-byte ratio is measuring the harness. `performance.now()` on this platform
 * resolves well under a millisecond, but the first pass over a small file is dominated by fixed per-call cost:
 * building the config, starting the parser, walking an empty scope. A 200 byte file that takes 1ms is not a
 * finding, it is the floor.
 */
const OUTLIER_FLOOR_BYTES = 4096;
const OUTLIER_FLOOR_MS = 2;

/**
 * How far above the corpus median a file's time per byte has to sit to be worth a look. Deliberately loose: at
 * 25x this is no longer a big file taking proportionally longer, it is a file whose cost is driven by something
 * other than its length, which is the signature worth chasing.
 */
const OUTLIER_FACTOR = 25;

const SIZE_BUCKETS = [
  {
    label: 'under 1 KiB',
    limit: 1024,
  },
  {
    label: '1 to 4 KiB',
    limit: 4096,
  },
  {
    label: '4 to 16 KiB',
    limit: 16384,
  },
  {
    label: '16 to 64 KiB',
    limit: 65536,
  },
  {
    label: '64 to 256 KiB',
    limit: 262144,
  },
  {
    label: 'over 256 KiB',
    limit: Infinity,
  },
];

// Nearest-rank rather than interpolated. The point is to name a file that took
// that long, not to invent a time between two of them.
const quantile = (sorted, fraction) => {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
};

const medianOf = (values) => {
  return quantile([...values].sort((left, right) => {
    return left - right;
  }), 0.5);
};

const nanosPerByte = (sample) => {
  return (sample.ms * 1e6) / sample.bytes;
};

const kib = (bytes) => {
  return `${(bytes / 1024).toFixed(1)} KiB`;
};

/**
 * Which rule dominates one file, by running each alone and taking the parse out of the answer. A single-rule pass
 * still pays for the parse, and on a large file that is most of it, so an empty rule set is timed first and
 * subtracted. Only ever called on the slowest handful, because it costs one pass per rule per file.
 */
const dominantRule = (file) => {
  const source = readFileSync(file, 'utf8');
  const name = nameFor(file, source);

  const beforeBaseline = performance.now();
  linter.verifyAndFix(source, configFor([]), name);
  const baseline = performance.now() - beforeBaseline;

  let worst = {
    ms: -Infinity,
    rule: 'none',
  };

  for (const rule of activeRules) {
    const started = performance.now();
    linter.verifyAndFix(source, configFor([rule]), name);
    const ms = performance.now() - started - baseline;

    if (ms > worst.ms) {
      worst = {
        ms,
        rule,
      };
    }
  }

  return {
    baseline,
    ...worst,
  };
};

const bucketRows = () => {
  const rows = [];
  let floor = 0;

  for (const { label, limit } of SIZE_BUCKETS) {
    const inBucket = timings.filter((sample) => {
      return sample.bytes >= floor && sample.bytes < limit;
    });

    floor = limit;

    if (inBucket.length > 0) {
      rows.push({
        files: inBucket.length,
        label,
        medianMs: medianOf(inBucket.map((sample) => {
          return sample.ms;
        })),
        nsPerByte: medianOf(inBucket.map(nanosPerByte)),
      });
    }
  }

  return rows;
};

/**
 * Whether time per byte climbs with file size, which is what a quadratic rule looks like from the outside. Only
 * buckets with enough files to have a stable median are compared, and the verdict is stated either way: a flat
 * table is the evidence that nothing here is superlinear, and it is worth printing.
 */
const SUPERLINEAR_MIN_FILES = 20;
const SUPERLINEAR_RATIO = 3;

const superlinearVerdict = (rows) => {
  const usable = rows.filter((row) => {
    return row.files >= SUPERLINEAR_MIN_FILES;
  });

  if (usable.length < 2) {
    return `  too few files per size bucket to say whether time per byte climbs (need ${SUPERLINEAR_MIN_FILES})`;
  }

  // Against the cheapest bucket rather than the smallest one. Small files are dominated by fixed per-call cost,
  // so anchoring there flatters every rule and would hide a climb that only starts in the middle of the range.
  const cheapest = usable.reduce((best, row) => {
    return row.nsPerByte < best.nsPerByte ? row : best;
  });

  const largest = usable[usable.length - 1];
  const ratio = largest.nsPerByte / cheapest.nsPerByte;

  const span = largest === cheapest
    ? `${largest.label}, the largest bucket with a stable median, is also the cheapest per byte`
    : `${largest.label} costs ${ratio.toFixed(2)}x the ns/byte of the cheapest bucket, ${cheapest.label}`;

  return ratio > SUPERLINEAR_RATIO
    ? `  ! superlinear: ${span}. A rule scaling worse than the text does looks exactly like this.`
    : `  time per byte does not climb with size (${span}), so nothing here looks superlinear`;
};

const showTiming = (wallMs) => {
  if (timings.length === 0) {
    console.log('\nno file was linted, so there is nothing to time');

    return;
  }

  const sortedMs = timings.map((sample) => {
    return sample.ms;
  }).sort((left, right) => {
    return left - right;
  });

  const lintMs = sortedMs.reduce((total, ms) => {
    return total + ms;
  }, 0);

  console.log('\ntiming: one whole-plugin --fix pass per linted file, the audit pass excluded');
  console.log(`  ${timings.length} files in ${(lintMs / 1000).toFixed(1)}s of fix time, `
    + `${(timings.length / (lintMs / 1000)).toFixed(1)} files/s (${(wallMs / 1000).toFixed(1)}s wall, `
    + 'the rest is reading, parsing and the audit)');
  console.log(`  per file: median ${quantile(sortedMs, 0.5).toFixed(2)}ms, `
    + `p99 ${quantile(sortedMs, 0.99).toFixed(2)}ms, slowest ${sortedMs[sortedMs.length - 1].toFixed(2)}ms`);

  console.log('  time per byte by size:');
  console.log(`    ${'size'.padEnd(14)}${'files'.padStart(7)}${'median ms'.padStart(12)}${'ns/byte'.padStart(10)}`);

  const rows = bucketRows();

  for (const row of rows) {
    console.log(`    ${row.label.padEnd(14)}${String(row.files).padStart(7)}`
      + `${row.medianMs.toFixed(2).padStart(12)}${row.nsPerByte.toFixed(0).padStart(10)}`);
  }

  console.log(superlinearVerdict(rows));

  const slowest = [...timings].sort((left, right) => {
    return right.ms - left.ms;
  }).slice(0, 20);

  console.log('  slowest 20, with the rule that dominates each:');

  for (const sample of slowest) {
    const dominant = dominantRule(sample.file);

    console.log(`    ${sample.ms.toFixed(1).padStart(8)}ms ${kib(sample.bytes).padStart(11)} `
      + `${nanosPerByte(sample).toFixed(0).padStart(6)} ns/byte  ${dominant.rule} `
      + `${dominant.ms.toFixed(1)}ms over a ${dominant.baseline.toFixed(1)}ms parse`);
    console.log(`      ${sample.file}`);
  }

  const measurable = timings.filter((sample) => {
    return sample.bytes >= OUTLIER_FLOOR_BYTES && sample.ms >= OUTLIER_FLOOR_MS;
  });

  if (measurable.length === 0) {
    return;
  }

  const median = medianOf(measurable.map(nanosPerByte));

  const outliers = measurable.filter((sample) => {
    return nanosPerByte(sample) > median * OUTLIER_FACTOR;
  }).sort((left, right) => {
    return nanosPerByte(right) - nanosPerByte(left);
  });

  // Not pushed into `findings`: a slow file is not a broken fix, and failing a release gate on someone else's
  // 300 KiB module would be noise. It is printed loudly and left to a human.
  console.log(`  ${outliers.length} timing outlier(s): over ${OUTLIER_FACTOR}x the median `
    + `${median.toFixed(0)} ns/byte, among files over ${OUTLIER_FLOOR_BYTES} bytes and ${OUTLIER_FLOOR_MS}ms`);

  for (const sample of outliers.slice(0, 20)) {
    console.log(`    ! ${sample.ms.toFixed(1)}ms ${kib(sample.bytes)} `
      + `${nanosPerByte(sample).toFixed(0)} ns/byte  ${sample.file}`);
  }
};

// --------------------------------------------------------------------- audit

const AUDIT_RULES = [
  'no-import-namespace-destructure',
  'prefer-arrow-functions',
  'prefer-await-to-then',
  'prefer-try-catch',
];

const REPORT_ONLY_RULES = [
  '@linteljs/no-import-namespace-destructure',
  '@linteljs/prefer-await-to-then',
  '@linteljs/prefer-try-catch',
];

const PROMISE_METHODS = new Set(['catch', 'finally', 'then']);

const FUNCTION_LIKE = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

/**
 * Where the hunt for a rebound `this` stops. An arrow inherits `this`, `arguments`, `new.target` and `super` from
 * the function around it, so a nested arrow is still the outer function's problem and gets walked into. A nested
 * `function` has its own, and a class body binds its own on methods and on arrow fields alike, so both end it.
 */
const OWNS_ITS_THIS = new Set(['ClassBody', 'FunctionDeclaration', 'FunctionExpression']);

/**
 * An independent answer to the one question `prefer-arrow-functions` cannot be allowed to get wrong, and the one
 * the fix-and-diff checks cannot see: a `function` is hoisted and a `const` arrow is not, so converting a
 * declaration that is called above itself turns working code into a `ReferenceError` and every property this
 * harness measures still holds. Written out here rather than imported from the rule, because a check that shares
 * the code it is checking agrees with every bug in it.
 */
const hoistedProbe = {
  create: (context) => {
    const { sourceCode } = context;

    return {
      FunctionDeclaration: (node) => {
        const [variable] = sourceCode.getDeclaredVariables(node);

        const early = variable?.references.some((reference) => {
          if (reference.identifier.range[0] >= node.range[0]) {
            return false;
          }

          // A call from inside another function body does not run at that point, so it is not evidence of
          // anything. Same line `no-use-before-define` draws with `functions: false`.
          return !sourceCode.getAncestors(reference.identifier).some((ancestor) => {
            return FUNCTION_LIKE.has(ancestor.type);
          });
        });

        if (early) {
          context.report({
            node,
            message: 'called above its own declaration',
          });
        }
      },
    };
  },
};

const auditConfig = configFor(AUDIT_RULES).map((entry) => {
  return {
    ...entry,
    plugins: {
      ...entry.plugins,
      probe: { rules: { hoisted: hoistedProbe } },
    },
    rules: {
      ...entry.rules,
      'probe/hoisted': 'error',
    },
  };
});

// Depth-first over anything with a `type`, carrying the parent and the key it
// was reached under. Returning `false` from `visit` prunes that branch.
const walkAst = (node, visit, parent, key) => {
  if (visit(node, parent, key) === false) {
    return;
  }

  for (const childKey of Object.keys(node)) {
    // `parent` climbs back out of the tree; ESLint adds it during traversal.
    if (childKey === 'parent') {
      continue;
    }

    const value = node[childKey];

    for (const child of Array.isArray(value) ? value : [value]) {
      if (child && typeof child.type === 'string') {
        walkAst(child, visit, node, childKey);
      }
    }
  }
};

const at = (node) => {
  return `${node.loc.start.line}:${node.loc.start.column}`;
};

// ESLint columns are one-based, `loc` columns are not.
const atReport = (report) => {
  return `${report.line}:${report.column - 1}`;
};

// A name in a non-computed member or key slot, not a reference to a binding.
const isPropertyName = (parent, key) => {
  if (!parent || parent.computed) {
    return false;
  }

  return (parent.type === 'MemberExpression' && key === 'property')
    || (parent.type === 'Property' && key === 'key');
};

const hazardOf = (node, parent, key) => {
  if (node.type === 'ThisExpression') {
    return 'this';
  }

  if (node.type === 'Super') {
    return 'super';
  }

  // `import.meta` is a MetaProperty too, and it is module-scoped, so an arrow
  // reads it exactly the same way. Only `new.target` is at stake.
  if (node.type === 'MetaProperty' && node.meta.name === 'new') {
    return 'new.target';
  }

  if (node.type === 'Identifier' && node.name === 'arguments' && !isPropertyName(parent, key)) {
    return 'arguments';
  }

  return undefined;
};

const bodyHazard = (fn) => {
  let found;

  walkAst(fn.body, (node, parent, key) => {
    if (found || (node !== fn.body && OWNS_ITS_THIS.has(node.type))) {
      return false;
    }

    found = hazardOf(node, parent, key);

    return found === undefined;
  });

  return found;
};

/**
 * The positions each report-only rule is entitled to sit on, read off the AST. The rules claim a shape; this
 * derives that shape independently and any report landing outside it is a false positive by construction. A real
 * one of exactly this kind, `promise[then](parse)`, is why the check exists.
 */
const shapesOf = (ast) => {
  const namespaces = new Set();

  walkAst(ast, (node) => {
    if (node.type === 'ImportNamespaceSpecifier') {
      namespaces.add(node.local.name);
    }

    return true;
  });

  const promiseCalls = new Set();
  const namespaceDestructures = new Set();
  const functions = new Map();

  walkAst(ast, (node) => {
    if (FUNCTION_LIKE.has(node.type)) {
      functions.set(at(node), node);
    }

    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
      && !node.callee.computed && node.callee.property.type === 'Identifier'
      && PROMISE_METHODS.has(node.callee.property.name)) {
      promiseCalls.add(at(node.callee.property));
    }

    if (node.type === 'VariableDeclarator' && node.id.type === 'ObjectPattern'
      && node.init?.type === 'Identifier' && namespaces.has(node.init.name)) {
      namespaceDestructures.add(at(node));
    }

    return true;
  });

  return {
    functions,
    namespaceDestructures,
    promiseCalls,
  };
};

const auditCounts = new Map();
const auditVolume = [];

const auditFinding = (rule, category, detail) => {
  return {
    category,
    detail,
    rules: [rule.replace('@linteljs/', '')],
  };
};

// One report, judged against the shape its rule claims and, for a conversion, against the original function body.
const judge = (report, shapes, probed) => {
  const spot = atReport(report);

  if (REPORT_ONLY_RULES.includes(report.ruleId)) {
    const allowed = report.ruleId === '@linteljs/no-import-namespace-destructure'
      ? shapes.namespaceDestructures
      : shapes.promiseCalls;

    return allowed.has(spot)
      ? undefined
      : auditFinding(report.ruleId, 'report shape', `report at ${spot} is not the shape the rule claims`);
  }

  // Only `preferArrow` with a fix attached is a conversion. `preferExplicit`
  // rewrites an arrow into an arrow, and a null fix converts nothing.
  if (report.messageId !== 'preferArrow' || !report.fix) {
    return undefined;
  }

  const fn = shapes.functions.get(spot);

  if (!fn) {
    return auditFinding(report.ruleId, 'report shape', `conversion reported at ${spot}, which is not a function`);
  }

  const hazard = bodyHazard(fn);

  if (hazard) {
    return auditFinding(report.ruleId, 'CRITICAL: guard leaked',
      `converted a function whose own body uses \`${hazard}\`, which an arrow rebinds`);
  }

  if (fn.type === 'FunctionDeclaration' && probed.has(spot)) {
    return auditFinding(report.ruleId, 'CRITICAL: guard leaked',
      'converted a declaration called above itself, which a `const` cannot support');
  }

  return undefined;
};

const audit = (file, source, ast, name) => {
  const reports = linter.verify(source, auditConfig, name);

  if (reports.some((report) => {
    return report.fatal;
  })) {
    return [];
  }

  const probed = new Set(reports.filter((report) => {
    return report.ruleId === 'probe/hoisted';
  }).map(atReport));

  const shapes = shapesOf(ast);
  const found = [];
  let volume = 0;

  for (const report of reports) {
    // An `eslint-disable` naming a rule this config never loaded is reported under that rule's own id, so
    // third-party disable comments arrive looking like findings. Only what this plugin said counts.
    if (!report.ruleId?.startsWith('@linteljs/')) {
      continue;
    }

    auditCounts.set(report.ruleId, (auditCounts.get(report.ruleId) ?? 0) + 1);
    volume += 1;

    const finding = judge(report, shapes, probed);

    if (finding) {
      found.push({
        ...finding,
        line: report.line,
      });
    }
  }

  if (volume > 0) {
    auditVolume.push({
      count: volume,
      file,
    });
  }

  return found;
};

// ---------------------------------------------------------------------- run

const findings = [];
const emptyCounts = () => {
  return {
    changed: 0,
    compiled: 0,
    duplicate: 0,
    minified: 0,
    oversized: 0,
    scanned: 0,
    unparsed: 0,
  };
};

const counts = {
  js: emptyCounts(),
  ts: emptyCounts(),
};
const seen = new Set();

const show = (file, finding, snippet, label) => {
  console.log(`\n! ${finding.category}: ${file}`);
  console.log(`  rules: ${finding.rules.join(', ')}`);
  console.log(`  ${finding.detail}`);
  console.log(`  ${label}:`);

  for (const line of snippet.split('\n').slice(0, 40)) {
    console.log(`    ${line}`);
  }
};

const around = (source, line) => {
  return `${source.split('\n').slice(Math.max(0, line - 3), line + 2).join('\n')}\n`;
};

const check = (file) => {
  const source = readFileSync(file, 'utf8');
  const flavour = flavourOf(file);
  const bucket = counts[flavour];

  const skipped = skipReason(source);

  if (skipped) {
    bucket[skipped] += 1;

    return;
  }

  const digest = createHash('sha256').update(source).digest('hex');

  if (seen.has(digest)) {
    bucket.duplicate += 1;

    return;
  }

  seen.add(digest);

  const name = nameFor(file, source);
  const ast = parseOrNull(source, name);

  if (!ast) {
    bucket.unparsed += 1;

    return;
  }

  bucket.scanned += 1;
  firstFixMs = undefined;

  for (const finding of audit(file, source, ast, name)) {
    findings.push({
      file,
      flavour,
      ...finding,
    });
    show(file, finding, around(source, finding.line), `reported at line ${finding.line}`);
  }

  const result = evaluate(source, name, activeRules, ast);

  // Recorded before the findings below, which re-lint the file several times
  // over and would otherwise land in the sample as this file's cost.
  if (firstFixMs !== undefined) {
    timings.push({
      bytes: source.length,
      file,
      ms: firstFixMs,
    });
  }

  if (!result.changed) {
    return;
  }

  bucket.changed += 1;

  for (const finding of result.findings) {
    if (finding.rules.length > 1) {
      const culprits = attribute(source, name, finding.rules, finding.category);
      finding.rules = culprits.length > 0 ? culprits : finding.rules;
    }

    const { snippet, narrowed } = narrow(source, result.fixed, name, finding);
    findings.push({
      file,
      flavour,
      ...finding,
    });
    show(file, finding, snippet, narrowed ? 'minimal reproduction' : 'changed hunk, could not narrow');
  }
};

const found = sources.flatMap((dir) => {
  return walk(dir, dir.includes('node_modules'), []);
});

const stride = Math.ceil(found.length / maxFiles);

/**
 * Every file, or a sample of them. The fix pass takes a prefix, which is what `--max-files` has always meant. The
 * option sweep takes every nth instead: the walk starts inside `node_modules`, and a prefix of that holds no
 * React code at all, so `sort-hook-dependencies` would go through every one of its configurations without being
 * handed a single hook to look at.
 */
const files = optionsMode && stride > 1
  ? found.filter((entry, index) => {
      return index % stride === 0;
    })
  : found.slice(0, maxFiles);

const byFlavour = (flavour) => {
  return files.filter((file) => {
    return flavourOf(file) === flavour;
  }).length;
};

const group = (keyOf) => {
  return [...tally(findings, keyOf)].sort((left, right) => {
    return right[1] - left[1];
  });
};

const runFixPass = () => {
  console.log(`• ${files.length} files (${byFlavour('ts')} TypeScript, ${byFlavour('js')} JavaScript) under:`);

  for (const dir of sources) {
    console.log(`    ${dir}`);
  }

  console.log(`• rules: ${activeRules.join(', ')}`);
  console.log(`• audit: ${AUDIT_RULES.join(', ')}\n`);

  const startedAt = Date.now();
  let visited = 0;

  for (const file of files) {
    visited += 1;

    try {
      check(file);
    }
    catch (error) {
      // One pathological file must not end the run, and a crash inside a rule
      // is exactly the kind of thing this script exists to surface.
      const finding = {
        file,
        category: 'threw',
        rules: activeRules,
        detail: message(error),
      };
      findings.push({
        flavour: flavourOf(file),
        ...finding,
      });
      show(file, finding, '', 'no snippet');
    }

    if (visited % 500 === 0) {
      const fixed = counts.ts.changed + counts.js.changed;
      console.log(`  ${visited}/${files.length} files, ${fixed} fixed, ${findings.length} findings`);
    }
  }

  const wallMs = Date.now() - startedAt;

  for (const [flavour, label] of [['ts', 'TypeScript'], ['js', 'JavaScript']]) {
    const bucket = counts[flavour];
    const hits = findings.filter((finding) => {
      return finding.flavour === flavour;
    }).length;

    console.log(`\n${label}: ${bucket.scanned} files linted, ${bucket.changed} changed by a fixer, `
      + `${hits} findings`);
    console.log(`  skipped: ${bucket.compiled} compiled, ${bucket.minified} minified or bundled, `
      + `${bucket.oversized} oversized, ${bucket.duplicate} duplicates, ${bucket.unparsed} the parser rejected`);
  }

  console.log('\nreports across the corpus:');

  for (const [ruleId, count] of [...auditCounts].sort((left, right) => {
    return right[1] - left[1];
  })) {
    console.log(`  ${String(count).padStart(7)}  ${ruleId}`);
  }

  // Volume alone is not a defect, so this does not fail the run. A rule sitting
  // on a wildly disproportionate share of one file is still worth a human look.
  console.log('busiest files:');

  for (const { count, file } of auditVolume.sort((left, right) => {
    return right.count - left.count;
  }).slice(0, 5)) {
    console.log(`  ${String(count).padStart(7)}  ${file}`);
  }

  showTiming(wallMs);

  if (findings.length === 0) {
    console.log('\n✓ every fix parsed, converged, and kept every token, line ending and comment,\n'
      + '  each still written against the code it was written against');
    console.log('✓ every conversion and every report matched the shape its rule claims');

    return;
  }

  console.log(`\n${findings.length} findings`);

  for (const [category, count] of group((finding) => {
    return finding.category;
  })) {
    console.log(`  ${count}  ${category}`);
  }

  console.log('by rule:');

  for (const [rule, count] of group((finding) => {
    return finding.rules.join(', ');
  })) {
    console.log(`  ${count}  ${rule}`);
  }

  process.exitCode = 1;
};

// ----------------------------------------------------------- option sweep

// An array option's members cannot be derived: the schema says only that they are strings. These are real hook
// names the default list leaves out, so a list containing them is a configuration someone would actually write.
const EXTRA_HOOK_NAMES = ['useLayoutEffect', 'useImperativeHandle'];

// The values one option is exercised at: both sides of a boolean, every member of an enum, and a low, default and high
// for a number. A property type with no values here throws, so an option added to a rule cannot quietly go unswept.
const valuesFor = (property) => {
  if (property.type === 'boolean') {
    return [true, false];
  }

  if (property.enum) {
    return property.enum;
  }

  if (property.type === 'integer') {
    // The high value is past anything a human would set, which is the point: the fix has to hold when the
    // threshold never trips as well as when it always does.
    return [property.minimum ?? 0, property.default, property.default * 2 + 2];
  }

  if (property.type === 'array') {
    return [property.default, [...property.default, ...EXTRA_HOOK_NAMES]];
  }

  throw new Error(`no values known for a schema property of type ${property.type}`);
};

const configurationsFor = (rule) => {
  const [schema] = rules[rule].meta.schema ?? [];

  return Object.entries(schema?.properties ?? {}).flatMap(([option, property]) => {
    return valuesFor(property).map((value) => {
      return {
        label: `${rule} { ${option}: ${JSON.stringify(value)} }`,
        options: { [rule]: { [option]: value } },
        rule,
      };
    });
  });
};

const configurations = activeRules.flatMap(configurationsFor);

// One file against every configuration, on the same five properties.
const sweep = (file, counters) => {
  const source = readFileSync(file, 'utf8');

  if (skipReason(source)) {
    return 0;
  }

  const digest = createHash('sha256').update(source).digest('hex');

  if (seen.has(digest)) {
    return 0;
  }

  seen.add(digest);

  const name = nameFor(file, source);
  const ast = parseOrNull(source, name);

  if (!ast) {
    return 0;
  }

  let found = 0;

  for (const configuration of configurations) {
    currentOptions = configuration.options;

    const counter = counters.get(configuration.label);
    counter.scanned += 1;

    const result = evaluate(source, name, [configuration.rule], ast);

    if (!result.changed) {
      continue;
    }

    counter.changed += 1;

    for (const finding of result.findings) {
      const { snippet, narrowed } = narrow(source, result.fixed, name, finding);

      console.log(`\n! under ${configuration.label}`);
      show(file, finding, snippet, narrowed ? 'minimal reproduction' : 'changed hunk, could not narrow');
      counter.findings += 1;
      found += 1;
    }
  }

  currentOptions = {};

  return found;
};

const runOptionSweep = () => {
  if (configurations.length === 0) {
    console.log('no rule in this run declares an option, so there is nothing to sweep');

    return;
  }

  console.log(`• ${files.length} files sampled, against ${configurations.length} configurations read off `
    + 'meta.schema:');

  for (const { label } of configurations) {
    console.log(`    ${label}`);
  }

  console.log('');

  const counters = new Map(configurations.map((configuration) => {
    return [configuration.label, {
      changed: 0,
      findings: 0,
      scanned: 0,
    }];
  }));

  let visited = 0;
  let found = 0;

  for (const file of files) {
    visited += 1;

    try {
      found += sweep(file, counters);
    }
    catch (error) {
      // Same reason as the fix pass: a crash inside a rule under a non-default
      // option is the defect this sweep exists to find, not a reason to stop.
      console.log(`\n! threw: ${file}\n  ${message(error)}`);
      found += 1;
    }

    if (visited % 250 === 0) {
      console.log(`  ${visited}/${files.length} files, ${found} findings`);
    }
  }

  console.log('\nper configuration: files linted, files changed by the fixer, findings');

  for (const { label } of configurations) {
    const counter = counters.get(label);

    console.log(`  ${String(counter.scanned).padStart(6)} ${String(counter.changed).padStart(6)} `
      + `${String(counter.findings).padStart(4)}  ${label}`);
  }

  if (found === 0) {
    console.log('\n✓ every fix parsed, converged, and kept every token, line ending and comment,\n'
      + '  each still written against the code it was written against, under every configuration');

    return;
  }

  console.log(`\n${found} findings`);
  process.exitCode = 1;
};

if (optionsMode) {
  runOptionSweep();
}
else {
  runFixPass();
}
