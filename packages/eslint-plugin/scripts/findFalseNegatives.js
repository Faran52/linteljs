/**
 * Hunts for the one defect every other gate in this repo is blind to: a rule that does not fire when it should.
 * Coverage, mutation and `scripts/fixRealCode.js` all measure a report or a fix that already happened, and none
 * can tell a rule that guards correctly from one that returns early on everything: a rule whose visitor never
 * matched would sail through 100% coverage, 92 mutation score and 82,921 files of real code with zero findings,
 * because silence is what all three reward.
 *
 * So this inverts the mutation and mutates the *input* rather than the rule. Take real third-party code the rule
 * is silent on, apply a mechanical edit that deliberately breaks that rule, and lint again: a report is the pass,
 * silence is a false negative. Two things make the result trustworthy, and both matter more than volume:
 *
 *   - The file must be silent for that rule *before* the edit, so any report after it is caused by the edit and
 *     no bookkeeping about locations is needed or can go wrong.
 *   - Every rule declines some inputs on purpose, read off `docs/rules/*.md` and encoded as skips. An edit landing
 *     on a comment, a template literal, an unsafe operand position or a threshold the rule does not meet is
 *     skipped, not counted: a false "false negative" sends someone to fix a rule that is behaving.
 *
 * Because of that, a large miss count is evidence of a broken transformation long before it is evidence of eleven
 * broken rules, and the summary says so. `--neuter <rule-id>` swaps that rule for one that reports nothing, which
 * is how the detector is proved able to fail: without it, a run saying "no false negatives" is indistinguishable
 * from one that never checked anything. Each rule gets several shapes, not one, since a rule can be awake on the
 * shape someone thought to test and asleep on the next, so `import-newlines` is broken five different ways and
 * every rule that admits more than one is broken more than one way. Counts, skips and misses are kept per shape.
 *
 * Usage: node scripts/findFalseNegatives.js [dir...] [--rule <id>] [--shape <text>]
 *          [--limit <n>] [--max-files <n>] [--neuter <id>]
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

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { rules } from '../src/rules/index.ts';

const root = resolve(import.meta.dirname, '..');
const linter = new Linter();

// espree ships inside ESLint, so reading JavaScript the way ESLint reads it costs no dependency. Resolved through
// ESLint because pnpm does not hoist a transitive dependency to the top level.
const espree = createRequire(createRequire(import.meta.url).resolve('eslint'))('espree');

/**
 * Every rule the plugin ships, and every rule this audit has shapes for. They are not the same list: a shape has to
 * be written by hand, so a rule added to the plugin is not covered here until someone writes one. `SHAPES` is
 * declared below, so the two are compared at run time rather than here.
 */
const PLUGIN_RULES = Object.keys(rules);

// Both only visit TypeScript nodes, so a JavaScript file can never exercise
// them and offering one as a candidate would be a skip with extra steps.
const TS_ONLY_RULES = new Set(['interface-order', 'union-newline']);

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'coverage', '.git', '.stryker-tmp']);

const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.tsx']);
const JAVASCRIPT_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs']);

// Same thresholds as `fixRealCode.js`, for the same reasons: above these sit bundled `.d.ts` blobs and minified
// output that cost seconds to parse and say nothing a hand-written file does not.
const MAX_BYTES = 512 * 1024;
const MAX_LINE = 1000;

const DEFAULT_CASES_PER_SHAPE = 40;

const args = process.argv.slice(2);

const flagValue = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
};

const onlyRule = flagValue('--rule');
const onlyShape = flagValue('--shape');
const neuteredRule = flagValue('--neuter');
const limitValue = flagValue('--limit');
const maxFilesValue = flagValue('--max-files');

const activeRules = onlyRule ? [onlyRule] : undefined;
const casesWanted = limitValue === undefined ? DEFAULT_CASES_PER_SHAPE : Number(limitValue);
const maxFiles = maxFilesValue === undefined ? Infinity : Number(maxFilesValue);

for (const name of [onlyRule, neuteredRule]) {
  if (name !== undefined && !PLUGIN_RULES.includes(name)) {
    console.error(`unknown rule: ${name}\nknown: ${PLUGIN_RULES.join(', ')}`);
    process.exit(2);
  }
}

// The index after each flag that was given, so a flag's value is not mistaken for a source directory.
const valueFlags = new Set(['--rule', '--shape', '--neuter', '--limit', '--max-files'].map((flag) => {
  return args.indexOf(flag) + 1;
}).filter((index) => {
  return index !== 0;
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

// -------------------------------------------------------------------- corpus

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
    else if (entry.isFile() && !entry.name.includes('.min.') && isScript(entry.name)) {
      found.push(full);
    }
  }

  return found;
};

/**
 * One file from each source in turn, rather than every file from the first. The sources are wildly different
 * populations: `node_modules` is mostly published output, `~/Projects` is hand-written application code, and the
 * clones are large open-source apps, so draining them in order would spend the whole per-rule budget on whichever
 * happens to be first.
 */
const interleave = (lists) => {
  const merged = [];
  const longest = Math.max(...lists.map((list) => {
    return list.length;
  }));

  for (let index = 0; index < longest; index++) {
    for (const list of lists) {
      if (index < list.length) {
        merged.push(list[index]);
      }
    }
  }

  return merged;
};

const countMatches = (text, pattern) => {
  return (text.match(pattern) ?? []).length;
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

  /**
   * An inline disable comment would suppress the report this script waits for, and the file would look like a
   * false negative when the rule was doing exactly as it was told. `noInlineConfig` below covers it too; this
   * keeps such files out of the sample entirely so the counts stay honest.
   */
  if (source.includes('eslint-disable')) {
    return 'disabled';
  }

  const lines = countMatches(source, /\n/g) + 1;

  return source.length / lines > 200 || longestLine(source) > MAX_LINE ? 'minified' : undefined;
};

// --------------------------------------------------------------------- lint

const configCache = new Map();

const JSX_ON = { ecmaFeatures: { jsx: true } };

/**
 * One rule, on both languages, with inline configuration switched off. `noInlineConfig` is the load-bearing part:
 * a third-party file carrying a blanket disable comment would silence the report the transformation exists to
 * provoke, and the run would record a false negative against a rule that never got the chance to speak.
 */
const configFor = (name, options) => {
  const key = `${name}|${JSON.stringify(options ?? null)}`;
  const cached = configCache.get(key);

  if (cached) {
    return cached;
  }

  /**
   * `--neuter` proves the detector can fail: a rule that reports nothing must turn every one of its transformed
   * cases into a recorded miss. It keeps the real `meta`, because ESLint validates options against the schema and
   * a stub without one rejects every shape that carries an option.
   */
  const rule = name === neuteredRule
    ? {
        create: () => {
          return {};
        },
        meta: rules[name].meta,
      }
    : rules[name];

  const shared = {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'off',
    },
    plugins: { '@linteljs': { rules: { [name]: rule } } },
    rules: { [`@linteljs/${name}`]: options ? ['error', options] : 'error' },
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

const reportsFor = (source, name, rule, options) => {
  const messages = linter.verify(source, configFor(rule, options), name);

  return {
    fatal: messages.some((message) => {
      return message.fatal;
    }),
    count: messages.filter((message) => {
      return message.ruleId === `@linteljs/${rule}`;
    }).length,
  };
};

// -------------------------------------------------------------------- parse

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

// The name the file is linted under, which is not its own. Same reasoning as `fixRealCode.js`: `.tsx` unlocks
// JSX, and a `.js` file on disk can be either a module or CommonJS, so probing settles it once.
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

/**
 * Parent links and a type index in one walk. `parseForESLint` hands back a bare tree, ESLint attaches `parent`
 * during its own traversal, and three of the transformations below need to climb. Indexing by type in the same
 * pass keeps the per-file cost to one walk however many rules are still looking for candidates.
 */
const indexAst = (ast) => {
  const byType = new Map();

  const visit = (node, parent) => {
    node.parent = parent;

    const list = byType.get(node.type);

    if (list) {
      list.push(node);
    }
    else {
      byType.set(node.type, [node]);
    }

    for (const key of Object.keys(node)) {
      if (key === 'parent') {
        continue;
      }

      const value = node[key];

      for (const child of Array.isArray(value) ? value : [value]) {
        if (child && typeof child.type === 'string') {
          visit(child, node);
        }
      }
    }
  };

  visit(ast, undefined);

  return byType;
};

// ---------------------------------------------------------- shared hazards

const FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

const nodesOf = (state, type) => {
  return state.index.get(type) ?? [];
};

const textOf = (state, node) => {
  return state.source.slice(node.range[0], node.range[1]);
};

const commentsIn = (state, from, to) => {
  return state.ast.comments.some((comment) => {
    return comment.range[1] > from && comment.range[0] < to;
  });
};

/**
 * Whether a stretch of source is safe to reflow onto one line. A line comment swallows everything after it, a
 * template literal and a string continuation both carry meaningful newlines, and a comment anywhere in range is a
 * case several of these rules decline on their own terms. Each is a skip rather than a transformation that would
 * produce a broken file or a report the rule was never obliged to make.
 */
const unsafeToReflow = (state, from, to) => {
  if (commentsIn(state, from, to)) {
    return 'comment inside the range the edit rewrites';
  }

  const slice = state.source.slice(from, to);

  if (slice.includes('`')) {
    return 'template literal in range, whose newlines are program text';
  }

  return /\\\r?\n/.test(slice) ? 'string line continuation in range' : undefined;
};

// Split and trim rather than one regex: the obvious `/[ \t]*\r?\n[ \t]*/g` is
// super-linear on a long run of indentation, which a corpus file will have.
const collapse = (text) => {
  return text.split(/\r?\n/).map((line) => {
    return line.trim();
  }).join(' ');
};

const replaced = (state, from, to, text) => {
  return {
    source: state.source.slice(0, from) + text + state.source.slice(to),
    offset: from,
  };
};

// Reflow one span onto a single line, or answer with the reason not to.
const joinRange = (state, from, to) => {
  const unsafe = unsafeToReflow(state, from, to);

  if (unsafe) {
    state.skip(unsafe);
    return undefined;
  }

  return replaced(state, from, to, collapse(state.source.slice(from, to)));
};

const spansLines = (first, last) => {
  return first.loc.start.line !== last.loc.end.line;
};

const climb = (node, matches) => {
  for (let current = node.parent; current; current = current.parent) {
    if (matches(current)) {
      return current;
    }
  }

  return undefined;
};

const pickFirst = (nodes, build) => {
  for (const node of nodes) {
    const built = build(node);

    if (built) {
      return built;
    }
  }

  return undefined;
};

// ---------------------------------------------------------- transformations

// Names this harness writes into a file. Any of them already present means the
// file is not a clean slate and the case is passed over.
const PROBE_ALIAS = 'lintelProbeAlias';
const PROBE_BINDING = 'lintelNamespaceProbe';
const PROBE_HANDLER = 'lintelRejectionProbe';
const PROBE_PROPS = 'lintelProbeProps';

// The defaults the rules ship, spelled out because these transformations have to produce input crossing them.
const DEFAULT_MAX_ITEMS = 2;
const DEFAULT_MAX_LINE_LENGTH = 120;
const DEFAULT_MAX_PROPERTIES = 2;

const isNamedImport = (specifier) => {
  return specifier.type === 'ImportSpecifier';
};

const membersOf = (node) => {
  return node.properties ?? node.elements;
};

// Every member on a line of its own, which is what these rules call correct.
const fullySplit = (members) => {
  return members.every((member, index) => {
    return index === 0 || spansLines(members[index - 1], member);
  });
};

/**
 * Open a blank line between two members by inserting after their comma. Two of these rules object to a gap in a
 * list that is otherwise correct, and that gap is the only way to reach those branches. The comma is found in the
 * text rather than through a token, because this harness holds a bare tree.
 */
const insertBlankLine = (state, previous, next) => {
  if (!spansLines(previous, next)) {
    return undefined;
  }

  if (commentsIn(state, previous.range[1], next.range[0])) {
    state.skip('comment in the gap the blank line would open');
    return undefined;
  }

  const comma = state.source.indexOf(',', previous.range[1]);

  if (comma === -1 || comma > next.range[0]) {
    return undefined;
  }

  return replaced(state, comma + 1, comma + 1, '\n');
};

// Rewrite a brace-delimited member list one member per line. The braces come from the member ranges, not the node, so
// an import attribute clause `with { type: 'json' }` cannot be mistaken for the closing brace of the split clause.
const splitBraces = (state, members) => {
  const first = members[0];
  const last = members[members.length - 1];
  const open = state.source.lastIndexOf('{', first.range[0]);
  const close = state.source.indexOf('}', last.range[1]);

  if (open === -1 || close === -1) {
    return undefined;
  }

  const unsafe = unsafeToReflow(state, open, close + 1);

  if (unsafe) {
    state.skip(unsafe);
    return undefined;
  }

  const text = members.map((member) => {
    return textOf(state, member);
  }).join(',\n  ');

  return replaced(state, open, close + 1, `{\n  ${text}\n}`);
};

/**
 * Whether every member carries a `;` or a `,` after it. An interface written without them relies on the newlines,
 * so joining it onto one line produces `{ a: string b: number }`, which does not parse: a broken edit rather than
 * a case, and skipped as one. A member's own range takes the delimiter with it, so the text is checked before the
 * gap.
 */
const separatedByPunctuation = (state, members) => {
  return members.every((member, index) => {
    if (index === members.length - 1) {
      return true;
    }

    const text = textOf(state, member);
    const gap = state.source.slice(member.range[1], members[index + 1].range[0]).trim();

    return /[;,]$/.test(text) || gap.startsWith(';') || gap.startsWith(',');
  });
};

// ---------------------------------------------------------- import-newlines

// A compliant multiline import, joined onto one line. Three or more named members, over the `maxItems` default,
// so the joined form has to split again.
const importJoinedCase = (state) => {
  return pickFirst(nodesOf(state, 'ImportDeclaration'), (node) => {
    const named = node.specifiers.filter(isNamedImport);

    if (named.length <= DEFAULT_MAX_ITEMS || node.loc.start.line === node.loc.end.line) {
      return undefined;
    }

    return joinRange(state, node.range[0], node.range[1]);
  });
};

// A short import split one member per line, which the rule collapses back. The other direction of the same rule,
// and the only one the joining cases above can never reach: a statement inside both limits must be on one line.
const importSplitCase = (state) => {
  return pickFirst(nodesOf(state, 'ImportDeclaration'), (node) => {
    const named = node.specifiers.filter(isNamedImport);

    // Silent and on one line means it is inside both limits already, so the
    // collapsed form the rule wants is exactly what is there now.
    if (named.length === 0 || named.length > DEFAULT_MAX_ITEMS
      || node.loc.start.line !== node.loc.end.line) {
      return undefined;
    }

    return splitBraces(state, named);
  });
};

// A short import pushed past `maxLineLength` by padding its module specifier. Padding rather than adding a
// member, because the member count is the other trigger and this case exists to reach the length one on its own.
const importLongLineCase = (state) => {
  return pickFirst(nodesOf(state, 'ImportDeclaration'), (node) => {
    const named = node.specifiers.filter(isNamedImport);

    if (named.length === 0 || node.loc.start.line !== node.loc.end.line) {
      return undefined;
    }

    const needed = DEFAULT_MAX_LINE_LENGTH + 1 - node.loc.start.column - textOf(state, node).length;

    if (needed <= 0) {
      return undefined;
    }

    const end = node.source.range[1];

    // Inside the quotes, so the padding cannot be read as anything but part of the module name.
    return /['"]/.test(state.source[end - 1])
      ? replaced(state, end - 1, end - 1, 'x'.repeat(needed))
      : undefined;
  });
};

// The last two members of a split import, brought onto one line.
const importTailJoinedCase = (state) => {
  return pickFirst(nodesOf(state, 'ImportDeclaration'), (node) => {
    const named = node.specifiers.filter(isNamedImport);

    if (named.length < 3 || !fullySplit(named)) {
      return undefined;
    }

    return joinRange(state, named[named.length - 2].range[1], named[named.length - 1].range[0]);
  });
};

// A blank line between two members of an otherwise correct split import.
const importBlankLineCase = (state) => {
  return pickFirst(nodesOf(state, 'ImportDeclaration'), (node) => {
    const named = node.specifiers.filter(isNamedImport);

    if (named.length < 2 || !fullySplit(named)) {
      return undefined;
    }

    return insertBlankLine(state, named[0], named[1]);
  });
};

// ----------------------------------------------------- newline-destructuring

const restCount = (properties) => {
  return properties.filter((property) => {
    return property.type === 'RestElement';
  }).length;
};

/**
 * A compliant split pattern, joined onto one line. Over the threshold and all on one line is `mustSplit`,
 * unconditionally: the rule has no comment or shape exemption left once the members share a line. A rest element
 * drops that threshold from two to one, a different branch and so a case of its own.
 */
const patternJoinedCase = (withRest) => {
  return (state) => {
    return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
      const properties = node.properties;
      const hasRest = restCount(properties) > 0;
      const threshold = hasRest ? 1 : DEFAULT_MAX_PROPERTIES;

      if (hasRest !== withRest || properties.length <= threshold
        || !spansLines(properties[0], properties[properties.length - 1])) {
        return undefined;
      }

      return joinRange(state, node.range[0], node.range[1]);
    });
  };
};

// A pattern at the threshold, split across lines. At or under `maxProperties` the rule wants one line, so this is
// the opposite edit to the one above and lands on the opposite branch.
const patternSplitCase = (state) => {
  return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
    const properties = node.properties;

    if (properties.length !== DEFAULT_MAX_PROPERTIES || restCount(properties) > 0
      || spansLines(properties[0], properties[1])) {
      return undefined;
    }

    return splitBraces(state, properties);
  });
};

// A blank line between two properties of an otherwise correct split pattern.
const patternBlankLineCase = (state) => {
  return pickFirst(nodesOf(state, 'ObjectPattern'), (node) => {
    const properties = node.properties;

    if (properties.length <= DEFAULT_MAX_PROPERTIES || !fullySplit(properties)) {
      return undefined;
    }

    return insertBlankLine(state, properties[0], properties[1]);
  });
};

// An interface body or a type literal, joined onto one line. The rule holds all three of these to the same shape
// through one predicate, but by way of two visitors the pattern cases never reach.
const typeMembersJoinedCase = (type, key) => {
  return (state) => {
    return pickFirst(nodesOf(state, type), (node) => {
      const members = node[key];

      if (members.length <= DEFAULT_MAX_PROPERTIES
        || !spansLines(members[0], members[members.length - 1])) {
        return undefined;
      }

      if (!separatedByPunctuation(state, members)) {
        state.skip('members separated by newlines alone, so joining them would not parse');
        return undefined;
      }

      return joinRange(state, node.range[0], node.range[1]);
    });
  };
};

// --------------------------------------------- destructuring-property-newline

/**
 * One gap closed in a pattern that is otherwise one member per line. This rule allows a pattern entirely on one
 * line, so joining the whole thing would produce compliant code and a skip that reads as a miss. The shape it
 * objects to is the half-wrapped one, so exactly one gap closes and the rest stay open, which is why the pattern
 * has to be fully split to begin with. Array holes are excluded: a hole has no tokens, the rule says so, and the
 * pair it takes part in cannot be measured.
 */
const patternGapCase = (type, fromStart) => {
  return (state) => {
    return pickFirst(nodesOf(state, type), (node) => {
      const members = membersOf(node);

      if (members.length < 3 || members.includes(null) || !fullySplit(members)) {
        return undefined;
      }

      const index = fromStart ? 1 : members.length - 1;

      return joinRange(state, members[index - 1].range[1], members[index].range[0]);
    });
  };
};

// --------------------------------------------------- export-specifier-newline

const exportJoinedCase = (state) => {
  return pickFirst(nodesOf(state, 'ExportNamedDeclaration'), (node) => {
    const specifiers = node.specifiers;
    const last = specifiers[specifiers.length - 1];

    if (specifiers.length < 2 || !spansLines(specifiers[0], last)) {
      return undefined;
    }

    return joinRange(state, specifiers[0].range[0], last.range[1]);
  });
};

const exportKindOf = (node) => {
  if (node.exportKind === 'type') {
    return 'type';
  }

  return node.source ? 'from' : 'local';
};

/**
 * A second specifier added beside a lone one, on the same line. A single-specifier export is correct however it
 * is written, so no joining edit reaches it. Re-exporting the same local under a second name is legal in all
 * three forms and needs nothing from the rest of the file, which is what makes the three comparable.
 */
const exportPairCase = (kind) => {
  return (state) => {
    if (state.source.includes(PROBE_ALIAS)) {
      return undefined;
    }

    return pickFirst(nodesOf(state, 'ExportNamedDeclaration'), (node) => {
      const [only] = node.specifiers;

      if (node.specifiers.length !== 1 || exportKindOf(node) !== kind) {
        return undefined;
      }

      // `export { default }` without a `from` clause is not legal, and the
      // keyword cannot be aliased into a local binding either.
      if (only.local.type !== 'Identifier' || only.local.name === 'default') {
        return undefined;
      }

      return replaced(state, only.range[1], only.range[1], `, ${only.local.name} as ${PROBE_ALIAS}`);
    });
  };
};

// ------------------------------------------------------------- union-newline

// Where a union may be introduced without changing what it binds to. A bare `extends` or `implements` clause does
// not accept one at all, and an array or indexed-access parent would take the added member with it.
const UNION_SAFE_PARENTS = new Set([
  'TSTypeAliasDeclaration',
  'TSTypeAnnotation',
  'TSTypeParameterInstantiation',
]);

// Anything that cannot itself be a reason to split, so a union built out of
// these members reports for the reason the shape says it does.
const PLAIN_TYPES = new Set([
  'TSBooleanKeyword',
  'TSLiteralType',
  'TSNumberKeyword',
  'TSStringKeyword',
  'TSTypeReference',
]);

/**
 * A plain type widened into a union by one member the rule always splits on. The four member types are four
 * separate reasons to split, read off the doc page, and a union of plain members is not a case at all however
 * long it runs. The member is written rather than found: a file already holding a union of mapped types, or even
 * a bare constructor type, is not something a corpus can be relied on for, and what the rule has to notice is the
 * member's type rather than where it came from. It is parenthesised because a function or constructor type is not
 * legal bare inside a union; typescript-eslint elides the parentheses, so what the rule sees is the member itself.
 */
const unionWithMemberCase = (member) => {
  return (state) => {
    return pickFirst([...PLAIN_TYPES].flatMap((type) => {
      return nodesOf(state, type);
    }), (node) => {
      if (!UNION_SAFE_PARENTS.has(node.parent?.type)) {
        return undefined;
      }

      return replaced(state, node.range[0], node.range[1], `${textOf(state, node)} | ${member}`);
    });
  };
};

// A generic argument widened past `maxGenericMembers`, with plain members.
const unionGenericCase = (state) => {
  return pickFirst(nodesOf(state, 'TSTypeParameterInstantiation'), (node) => {
    const [first] = node.params;

    if (!first || !PLAIN_TYPES.has(first.type) || spansLines(first, first)) {
      return undefined;
    }

    // Four members, one over the default of three.
    return replaced(state, first.range[0], first.range[1],
      `${textOf(state, first)} | 'lintelProbeB' | 'lintelProbeC' | 'lintelProbeD'`);
  });
};

// ----------------------------------------------------- prefer-arrow-functions

/**
 * Everything an arrow inherits and a `function` would rebind. The rule declines all of these, so a rewrite
 * carrying one would be a skip. The scan is textual and over-skips, the right direction: a candidate lost costs
 * nothing, a false miss costs someone an afternoon.
 */
const ARROW_HAZARDS = /\b(?:this|arguments|super|asserts)\b|new\s*\.\s*target/;

const arrowNameIsFunctionOnly = (state, name) => {
  const escaped = name.replace(/[$]/g, '\\$&');

  // `new f()`, `f.prototype` and reassignment are the three things a `const` cannot support, and the rule stays
  // silent on a declaration used any of those ways. The declaration itself is the one assignment expected.
  return new RegExp(String.raw`new\s+${escaped}\b|\b${escaped}\s*\.\s*prototype\b`).test(state.source)
    || countMatches(state.source, new RegExp(String.raw`\b${escaped}\s*=(?!=)`, 'g')) > 1;
};

// The pieces every rewrite below assembles, in the one place they agree.
const functionParts = (state, arrow) => {
  return {
    body: textOf(state, arrow.body),
    params: arrow.params.map((param) => {
      return textOf(state, param);
    }).join(', '),
    prefix: arrow.async === true ? 'async ' : '',
    returnType: arrow.returnType ? textOf(state, arrow.returnType) : '',
  };
};

const writeFunctionExpression = (state, arrow, name = '') => {
  const {
    body,
    params,
    prefix,
    returnType,
  } = functionParts(state, arrow);

  return `${prefix}function ${name}(${params})${returnType} ${body}`;
};

const writeShorthandMethod = (state, property, arrow) => {
  const {
    body,
    params,
    prefix,
    returnType,
  } = functionParts(state, arrow);

  return `${prefix}${textOf(state, property.key)}(${params})${returnType} ${body}`;
};

// Why this arrow cannot be rewritten as a `function` and still be a case.
const arrowBodySkipReason = (state, arrow, from) => {
  if (arrow.body.type !== 'BlockStatement') {
    return undefined;
  }

  if (arrow.typeParameters) {
    return 'arrow carries type parameters, which the rebuild does not reproduce';
  }

  if (ARROW_HAZARDS.test(textOf(state, arrow))) {
    return 'body uses this/arguments/super/new.target, which the rule declines';
  }

  return commentsIn(state, from, arrow.body.range[0])
    ? 'comment outside the body, which the rebuild cannot carry'
    : undefined;
};

const arrowDeclarationOf = (node) => {
  const [declarator] = node.declarations;

  if (node.kind !== 'const' || node.declarations.length !== 1
    || declarator.id.type !== 'Identifier' || declarator.id.typeAnnotation) {
    return undefined;
  }

  const arrow = declarator.init;

  if (arrow?.type !== 'ArrowFunctionExpression' || arrow.body.type !== 'BlockStatement'
    || arrow.typeParameters) {
    return undefined;
  }

  return {
    arrow,
    name: declarator.id.name,
  };
};

const STATEMENT_PARENTS = new Set(['Program', 'BlockStatement', 'ExportNamedDeclaration']);

const arrowDeclarationSkipReason = (state, node, found) => {
  if (!STATEMENT_PARENTS.has(node.parent?.type)) {
    return 'arrow sits where a function declaration is not a statement';
  }

  if (!textOf(state, node).endsWith(';')) {
    return 'declaration has no semicolon, so the rewrite risks a continuation';
  }

  const body = arrowBodySkipReason(state, found.arrow, node.range[0]);

  if (body) {
    return body;
  }

  return arrowNameIsFunctionOnly(state, found.name)
    ? 'name is constructed, reassigned or carries a prototype'
    : undefined;
};

// `const f = () => {}` rewritten as a hoisted `function` declaration.
const functionDeclarationCase = (state) => {
  return pickFirst(nodesOf(state, 'VariableDeclaration'), (node) => {
    const found = arrowDeclarationOf(node);

    if (!found) {
      return undefined;
    }

    const skipped = arrowDeclarationSkipReason(state, node, found);

    if (skipped) {
      state.skip(skipped);
      return undefined;
    }

    return replaced(state, node.range[0], node.range[1],
      writeFunctionExpression(state, found.arrow, found.name));
  });
};

// The same declaration left as a `const`, holding a function expression. A different visitor: the rule reaches a bare
// function expression through a selector excluding property and class positions, and hoisting does not apply.
const functionExpressionCase = (state) => {
  return pickFirst(nodesOf(state, 'VariableDeclaration'), (node) => {
    const found = arrowDeclarationOf(node);

    if (!found) {
      return undefined;
    }

    const skipped = arrowBodySkipReason(state, found.arrow, found.arrow.range[0]);

    if (skipped) {
      state.skip(skipped);
      return undefined;
    }

    return replaced(state, found.arrow.range[0], found.arrow.range[1],
      writeFunctionExpression(state, found.arrow));
  });
};

const objectArrowProperty = (node) => {
  const arrow = node.value;

  if (node.kind !== 'init' || node.method || node.computed
    || arrow?.type !== 'ArrowFunctionExpression' || arrow.body.type !== 'BlockStatement'
    || arrow.typeParameters) {
    return undefined;
  }

  return arrow;
};

/**
 * A property value written long form, and the same value written shorthand. One visitor handles both but forks on
 * `property.method`: the long form replaces the value alone, the shorthand the whole property, because the key is
 * not inside the function's own range.
 */
const propertyFunctionCase = (asMethod) => {
  return (state) => {
    return pickFirst(nodesOf(state, 'Property'), (node) => {
      const arrow = objectArrowProperty(node);

      if (!arrow) {
        return undefined;
      }

      const skipped = arrowBodySkipReason(state, arrow, node.range[0]);

      if (skipped) {
        state.skip(skipped);
        return undefined;
      }

      return asMethod
        ? replaced(state, node.range[0], node.range[1], writeShorthandMethod(state, node, arrow))
        : replaced(state, arrow.range[0], arrow.range[1], writeFunctionExpression(state, arrow));
    });
  };
};

// `export default () => {}` rewritten as an anonymous default declaration.
const defaultExportFunctionCase = (state) => {
  return pickFirst(nodesOf(state, 'ExportDefaultDeclaration'), (node) => {
    const arrow = node.declaration;

    // An expression body is the `preferExplicit` case, which has its own shape.
    if (arrow?.type !== 'ArrowFunctionExpression' || arrow.body.type !== 'BlockStatement') {
      return undefined;
    }

    const skipped = arrowBodySkipReason(state, arrow, arrow.range[0]);

    if (skipped) {
      state.skip(skipped);
      return undefined;
    }

    return replaced(state, arrow.range[0], arrow.range[1], writeFunctionExpression(state, arrow));
  });
};

// A block body holding one `return`, collapsed to an expression body. The `preferExplicit` visitor, the one
// direction of this rule with nothing to do with the `function` keyword.
const expressionBodyCase = (state) => {
  return pickFirst(nodesOf(state, 'ArrowFunctionExpression'), (node) => {
    if (node.body.type !== 'BlockStatement' || node.body.body.length !== 1) {
      return undefined;
    }

    const [only] = node.body.body;

    if (only.type !== 'ReturnStatement' || !only.argument) {
      return undefined;
    }

    if (ARROW_HAZARDS.test(textOf(state, node))) {
      state.skip('body uses this/arguments/super, which the rule declines');
      return undefined;
    }

    if (commentsIn(state, node.body.range[0], node.body.range[1])) {
      state.skip('comment inside the body, which the collapse cannot carry');
      return undefined;
    }

    // Parenthesised so an object literal or a sequence cannot change meaning in expression position.
    return replaced(state, node.body.range[0], node.body.range[1],
      `(${textOf(state, only.argument)})`);
  });
};

// ------------------------------------------------------ the two promise rules

const inConstructor = (node) => {
  return climb(node, (ancestor) => {
    return ancestor.type === 'MethodDefinition' && ancestor.kind === 'constructor';
  }) !== undefined;
};

// The gap between the `await` keyword and its operand, which must be blank.
const awaitGapIsClean = (state, node) => {
  return state.source.slice(node.range[0] + 'await'.length, node.argument.range[0]).trim() === '';
};

/**
 * A statement-position `await` rewritten as a detached handler. Detached is the point: nothing awaits the result
 * and nothing returns it from an async function, so the handover to `prefer-try-catch` does not apply and this
 * rule is the one on the hook. `then`, `catch` and `finally` are three separate names in the rule's own set, so
 * each is its own case.
 */
const detachedHandlerCase = (method) => {
  return (state) => {
    return pickFirst(nodesOf(state, 'ExpressionStatement'), (node) => {
      const awaited = node.expression;

      if (awaited?.type !== 'AwaitExpression' || !textOf(state, node).endsWith(';')) {
        return undefined;
      }

      const inFunction = climb(node, (ancestor) => {
        return FUNCTION_TYPES.has(ancestor.type);
      });

      if (!inFunction) {
        state.skip('await at module top level, which the rule exempts');
        return undefined;
      }

      if (inConstructor(node)) {
        state.skip('await inside a constructor, which the rule exempts');
        return undefined;
      }

      if (!awaitGapIsClean(state, awaited)) {
        state.skip('comment between `await` and its operand');
        return undefined;
      }

      return replaced(state, awaited.range[0], awaited.range[1],
        `(${textOf(state, awaited.argument)}).${method}(() => {})`);
    });
  };
};

/**
 * A handler on a value that is awaited, which only `strict` objects to. At the default this is
 * `prefer-try-catch`'s line and this rule is silent by design; under `strict` every exemption drops and the two
 * deliberately overlap, a branch nothing else here reaches.
 */
const strictAwaitedHandlerCase = (state) => {
  return pickFirst(nodesOf(state, 'AwaitExpression'), (node) => {
    const inFunction = climb(node, (ancestor) => {
      return FUNCTION_TYPES.has(ancestor.type);
    });

    // Even under `strict` the top level of a module is exempt.
    if (!inFunction) {
      state.skip('await at module top level, which the rule exempts under strict too');
      return undefined;
    }

    if (!awaitGapIsClean(state, node)) {
      state.skip('comment between `await` and its operand');
      return undefined;
    }

    return replaced(state, node.argument.range[0], node.argument.range[1],
      `(${textOf(state, node.argument)}).then(() => {})`);
  });
};

/**
 * A rejection handler hung off an existing `await`. The doc's own incorrect example is
 * `await fetch(url).catch(handle)`, and this builds exactly that shape from an await already in the file. Going
 * the other way, unpicking a real `try`/`catch` into a chain, cannot be done mechanically without deciding which
 * statements belong in the handler, and a wrong answer there would be a broken transformation reported as a rule
 * defect. The three suffixes are three different readings: a `catch`, a two-argument `then` whose second argument
 * is the handler, and a handler buried mid-chain behind a later `then`.
 */
const awaitedHandlerCase = (suffix) => {
  return (state) => {
    return pickFirst(nodesOf(state, 'AwaitExpression'), (node) => {
      if (!awaitGapIsClean(state, node)) {
        state.skip('comment between `await` and its operand');
        return undefined;
      }

      return replaced(state, node.range[0], node.range[1],
        `await (${textOf(state, node.argument)})${suffix}`);
    });
  };
};

// A handler on a value returned from an async function. The caller's `await` settles it, the other half of the
// predicate the two promise rules share, and the half no `await` in the file can reach.
const asyncReturnHandlerCase = (state) => {
  return pickFirst(nodesOf(state, 'ReturnStatement'), (node) => {
    if (!node.argument) {
      return undefined;
    }

    const fn = climb(node, (ancestor) => {
      return FUNCTION_TYPES.has(ancestor.type);
    });

    if (fn?.async !== true) {
      return undefined;
    }

    if (commentsIn(state, node.range[0], node.argument.range[0])) {
      state.skip('comment between `return` and its argument');
      return undefined;
    }

    return replaced(state, node.argument.range[0], node.argument.range[1],
      `(${textOf(state, node.argument)}).catch(${PROBE_HANDLER})`);
  });
};

// ---------------------------------------- no-import-namespace-destructure

const escapeName = (name) => {
  return name.replace(/[$]/g, '\\$&');
};

/**
 * Whether the namespace name is bound again anywhere around the edit. A local binding of the same name shadows
 * the import, and the rule is right to stay quiet on that. Textual and over-skipping, the safe direction here: a
 * site skipped costs a case, a site kept costs a false report against a rule that did nothing wrong. Both halves
 * are wider than they first were: `\s+` after the keyword missed `const [monaco, setMonaco] = useState()`, and
 * reading only the edited node's own parameters missed `(_, monaco) => {` around it. React's playground has both,
 * against `import * as monaco`, and each was reported as a rule defect.
 */
const shadowsName = (state, node, name) => {
  const escaped = escapeName(name);
  const declares = new RegExp(String.raw`\b(?:const|let|var|function|class)\b[^;=]*\b${escaped}\b`);
  const named = new RegExp(String.raw`\b${escaped}\b`);

  for (let current = node; current && current.type !== 'Program'; current = current.parent) {
    if (declares.test(textOf(state, current))) {
      return true;
    }

    if ((current.params ?? []).some((param) => {
      return named.test(textOf(state, param));
    })) {
      return true;
    }
  }

  return false;
};

const namespaceImportOf = (node) => {
  if (node.parent?.type !== 'Program') {
    return undefined;
  }

  return node.specifiers.find((specifier) => {
    return specifier.type === 'ImportNamespaceSpecifier';
  });
};

/**
 * A destructure of a namespace import, placed at one of three depths. The scope depth is the whole point: this
 * rule resolved names in the immediate scope only when it was ported, so it was dead inside any function or
 * block, and a module-level case alone would have proved nothing about either. The insertion point is always the
 * first statement of its block, so nothing between the import and the destructure can shadow the binding.
 */
const namespaceDestructureCase = (place) => {
  return (state) => {
    if (state.source.includes(PROBE_BINDING)) {
      return undefined;
    }

    const namespace = pickFirst(nodesOf(state, 'ImportDeclaration'), namespaceImportOf);

    if (!namespace) {
      return undefined;
    }

    const name = namespace.local.name;
    const line = `const { ${PROBE_BINDING} } = ${name};`;

    if (place === 'module') {
      return replaced(state, namespace.parent.range[1], namespace.parent.range[1], `\n${line}`);
    }

    const host = pickFirst(nodesOf(state, place === 'function' ? 'FunctionDeclaration' : 'BlockStatement'),
      (node) => {
        const block = place === 'function' ? node.body : node;

        // A function's own block is reached through the function, so a plain block case must not pick it up again.
        if (block?.type !== 'BlockStatement' || block.range[0] < namespace.range[1]
          || (place === 'block' && FUNCTION_TYPES.has(node.parent?.type))) {
          return undefined;
        }

        return shadowsName(state, node, name) ? undefined : block;
      });

    if (!host) {
      return undefined;
    }

    return replaced(state, host.range[0] + 1, host.range[0] + 1, `\n${line}`);
  };
};

// ---------------------------------------------------- sort-hook-dependencies

const DEFAULT_HOOKS = ['useEffect', 'useCallback', 'useMemo'];

// Two hook names in wide use that the default list does not carry, which is
// the only way to exercise the `hooks` option against real code.
const EXTRA_HOOKS = ['useLayoutEffect', 'useImperativeHandle'];

// The rule's own comparator, written out rather than imported. A check that
// shares the code it is checking agrees with every bug in it.
const compareNames = (left, right) => {
  return left.localeCompare(right, 'en', { numeric: true });
};

const dependencyNames = (node, hooks) => {
  const last = node.arguments[node.arguments.length - 1];

  if (node.callee.type !== 'Identifier' || !hooks.includes(node.callee.name)
    || last?.type !== 'ArrayExpression' || last.elements.length < 2) {
    return undefined;
  }

  // A member expression, a call or a spread means the rule leaves the array
  // alone, so reordering one would be a skip dressed up as a case.
  const plain = last.elements.every((element) => {
    return element?.type === 'Identifier';
  });

  return plain
    ? {
        array: last,
        names: last.elements.map((element) => {
          return element.name;
        }),
      }
    : undefined;
};

/**
 * A dependency array put into the order the configured `order` forbids. Sorted the wrong way rather than
 * reversed: a reversed array can land sorted by accident, and under `desc` the file that is silent to begin with
 * is the one whose arrays already run backwards.
 */
const hookOrderCase = (hooks, wanted) => {
  return (state) => {
    return pickFirst(nodesOf(state, 'CallExpression'), (node) => {
      const found = dependencyNames(node, hooks);

      if (!found) {
        return undefined;
      }

      const sorted = [...found.names].sort(compareNames);
      const target = wanted === 'asc' ? sorted : sorted.reverse();

      if (target.join() === found.names.join()) {
        state.skip('dependency array is already in the order the edit would write');
        return undefined;
      }

      const unsafe = unsafeToReflow(state, found.array.range[0], found.array.range[1]);

      if (unsafe) {
        state.skip(unsafe);
        return undefined;
      }

      return replaced(state, found.array.range[0], found.array.range[1], `[${target.join(', ')}]`);
    });
  };
};

// ------------------------------------------------------------ interface-order

const TYPE_DECLARATIONS = new Set(['TSInterfaceDeclaration', 'TSTypeAliasDeclaration']);

const isTypeDeclaration = (node) => {
  return TYPE_DECLARATIONS.has(node.type)
    || (node.type === 'ExportNamedDeclaration' && TYPE_DECLARATIONS.has(node.declaration?.type));
};

// typescript-eslint puts a `directive` key on every ExpressionStatement and leaves it undefined when the
// statement is not one, so the value decides rather than the key.
const isDirective = (node) => {
  return node.type === 'ExpressionStatement' && node.directive !== undefined;
};

const isHeader = (node) => {
  return node.type === 'ImportDeclaration' || isDirective(node);
};

const lineStartOf = (source, offset) => {
  return source.lastIndexOf('\n', offset - 1) + 1;
};

const lineEndOf = (source, offset) => {
  const index = source.indexOf('\n', offset);
  return index === -1 ? source.length : index + 1;
};

/**
 * A top-level type declaration moved to the bottom of the file. Whole lines move, not the node's own range, so
 * the edit cannot leave half a line behind; a declaration sharing its first or last line with anything else is
 * skipped for that reason rather than sliced.
 */
const relocateType = (state, node) => {
  const from = lineStartOf(state.source, node.range[0]);
  const to = lineEndOf(state.source, node.range[1]);

  if (state.source.slice(from, node.range[0]).trim() !== '') {
    state.skip('type declaration shares its opening line with other code');
    return undefined;
  }

  const text = state.source.slice(node.range[0], to).trimEnd();
  const kept = `${state.source.slice(0, from)}${state.source.slice(to)}`.trimEnd();

  return {
    source: `${kept}\n\n${text}\n`,
    offset: kept.length + 2,
  };
};

/**
 * The header decides where the fix puts the block it moves back, and there are three answers: after the last
 * import, after a directive prologue with no imports, or at the very top of a file with neither. A `'use client'`
 * is the one a Next.js codebase would notice getting wrong, so the three are counted apart.
 */
const headerKindOf = (body) => {
  if (body.some((entry) => {
    return entry.type === 'ImportDeclaration';
  })) {
    return 'imports';
  }

  return body.some(isDirective) ? 'directive' : 'none';
};

const typeBelowRuntimeCase = (header) => {
  return (state) => {
    const body = state.ast.body;

    if (headerKindOf(body) !== (header === 'directive' ? 'none' : header)) {
      return undefined;
    }

    const hasRuntime = body.some((entry) => {
      return !isHeader(entry) && !isTypeDeclaration(entry);
    });

    if (!hasRuntime) {
      return undefined;
    }

    const moved = pickFirst(body.filter(isTypeDeclaration), (node) => {
      return relocateType(state, node);
    });

    if (!moved || header !== 'directive') {
      return moved;
    }

    /**
     * A file already carrying a prologue and no imports is rare enough that the corpus cannot be relied on for
     * one, so the prologue is part of the edit. The rule's insertion point moves to it, the branch this shape
     * exists to reach, and a `'use client'` losing its place is the failure a Next.js codebase would feel.
     */
    const directive = "'use strict';\n\n";

    return {
      offset: moved.offset + directive.length,
      source: directive + moved.source,
    };
  };
};

// -------------------------------------------------------- prefer-destructured-props

/**
 * The names bound by a first parameter the rule would already leave alone: an `ObjectPattern` whose every
 * property is a plain shorthand, one property no less. A default, a rest element, a nested pattern or a
 * computed key each turn `property.shorthand` false or `property.value.type` away from `Identifier`, so this
 * one check is every exclusion the shape needs, read off the same conditions the inverse transform relies on.
 */
const propsPatternNames = (pattern) => {
  if (pattern?.type !== 'ObjectPattern' || pattern.properties.length === 0) {
    return undefined;
  }

  const names = [];

  for (const property of pattern.properties) {
    if (property.type !== 'Property' || property.computed || !property.shorthand
      || property.value.type !== 'Identifier') {
      return undefined;
    }

    names.push(property.value.name);
  }

  return names;
};

/**
 * A prop name bound again anywhere inside the function: a nested declaration, a nested function's own
 * parameter, an import, a catch clause. Any of these means the identifier the rewrite would emit no longer
 * refers to the prop everywhere in range, so the whole case is skipped rather than guessed at.
 */
const isDeclaringUse = (node) => {
  const parent = node.parent;

  switch (parent?.type) {
    case 'VariableDeclarator':
      return parent.id === node;
    case 'ArrayPattern':
      return parent.elements.includes(node);
    case 'RestElement':
      return parent.argument === node;
    case 'AssignmentPattern':
      return parent.left === node;
    case 'CatchClause':
      return parent.param === node;
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      return parent.id === node || parent.params.includes(node);
    case 'ClassDeclaration':
    case 'ClassExpression':
      return parent.id === node;
    case 'ImportSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
      return parent.local === node;
    case 'Property':
      return parent.value === node && parent.parent?.type === 'ObjectPattern';
    default:
      return false;
  }
};

// `{ alpha }` as an object literal's own shorthand: rewriting the value alone would leave `{ props.alpha }`,
// which does not parse, so this shape passes the whole case over rather than the one property.
const isObjectShorthandValue = (node) => {
  const parent = node.parent;

  return parent?.type === 'Property' && parent.shorthand === true && parent.value === node
    && parent.parent?.type === 'ObjectExpression';
};

// A key, not a use: `{ alpha: x }`, a class member, an interface member. Left untouched rather than rewritten.
const isNonReferenceKey = (node) => {
  const parent = node.parent;
  const keyed = new Set(['Property', 'PropertyDefinition', 'MethodDefinition',
    'TSPropertySignature', 'TSMethodSignature']);

  return Boolean(parent) && keyed.has(parent.type) && parent.key === node && !parent.computed;
};

// `foo.alpha`: the object might be anything, but the property name itself is not a reference to the prop.
const isNonReferenceMember = (node) => {
  const parent = node.parent;

  return parent?.type === 'MemberExpression' && parent.property === node && !parent.computed;
};

// `alpha: for (...) { break alpha; }`: a label happens to spell the same word and is not a reference either.
const isLabelUse = (node) => {
  const parent = node.parent;

  return (parent?.type === 'LabeledStatement' || parent?.type === 'BreakStatement'
    || parent?.type === 'ContinueStatement') && parent.label === node;
};

/**
 * The inverse of what the rule already accepts: a component whose props arrive destructured, rewritten so its
 * first parameter is a plain identifier and every reference to a formerly-destructured name becomes a member
 * read on it, which is exactly the shape the rule reports. The destructured names are the ground truth for
 * what a reference is, so no scope analysis is needed, only what a name's own parent node says it is doing.
 * `replaced` performs one contiguous edit, so every inner change is computed against the function's own text
 * first, right to left, and only the whole function is handed to it.
 */
const componentPropsRewrite = (state, fn, names) => {
  if (state.source.includes(PROBE_PROPS)) {
    return undefined;
  }

  const exported = nodesOf(state, 'ExportSpecifier').some((specifier) => {
    return names.includes(specifier.local.name) || names.includes(specifier.exported.name);
  });

  if (exported) {
    state.skip('a prop name is also an export specifier');
    return undefined;
  }

  const candidates = nodesOf(state, 'Identifier').filter((node) => {
    return names.includes(node.name) && node.range[0] >= fn.body.range[0] && node.range[1] <= fn.body.range[1];
  });

  const references = [];

  for (const node of candidates) {
    if (isDeclaringUse(node)) {
      state.skip('a prop name is redeclared or shadowed inside the function');
      return undefined;
    }

    if (isObjectShorthandValue(node)) {
      state.skip('a prop name is used as an object-literal shorthand value');
      return undefined;
    }

    if (isNonReferenceKey(node) || isNonReferenceMember(node) || isLabelUse(node)) {
      continue;
    }

    references.push(node);
  }

  // No member read left to force means no violation the rule would report either.
  if (references.length === 0) {
    return undefined;
  }

  const base = fn.range[0];
  const [firstParam] = fn.params;

  const edits = [
    {
      from: firstParam.range[0] - base,
      to: firstParam.range[1] - base,
      text: PROBE_PROPS,
    },
    ...references.map((node) => {
      return {
        from: node.range[0] - base,
        to: node.range[1] - base,
        text: `${PROBE_PROPS}.${node.name}`,
      };
    }),
  ].sort((left, right) => {
    return right.from - left.from;
  });

  const rewritten = edits.reduce((text, edit) => {
    return text.slice(0, edit.from) + edit.text + text.slice(edit.to);
  }, textOf(state, fn));

  return replaced(state, fn.range[0], fn.range[1], rewritten);
};

// `const Widget = ({ alpha, bravo }) => ...`, the arrow assigned to an uppercase binding.
const arrowComponentCase = (state) => {
  return pickFirst(nodesOf(state, 'VariableDeclarator'), (node) => {
    if (node.id.type !== 'Identifier' || !/^[A-Z]/.test(node.id.name)
      || node.init?.type !== 'ArrowFunctionExpression') {
      return undefined;
    }

    const names = propsPatternNames(node.init.params[0]);

    return names ? componentPropsRewrite(state, node.init, names) : undefined;
  });
};

// `function Widget({ alpha, bravo }) {...}`, judged by its own declared name.
const functionDeclarationComponentCase = (state) => {
  return pickFirst(nodesOf(state, 'FunctionDeclaration'), (node) => {
    if (!node.id || !/^[A-Z]/.test(node.id.name)) {
      return undefined;
    }

    const names = propsPatternNames(node.params[0]);

    return names ? componentPropsRewrite(state, node, names) : undefined;
  });
};

// --------------------------------------------------------------------- shapes

// Every violating edit, by rule. A shape is one distinct way of breaking that rule, each counted, skipped and
// reported on its own: a rule can be awake on the shape someone thought to test and asleep on the next.
const SHAPES = {
  'destructuring-property-newline': [
    {
      build: patternGapCase('ObjectPattern', false),
      shape: 'object pattern, last gap closed',
    },
    {
      build: patternGapCase('ObjectPattern', true),
      shape: 'object pattern, first gap closed',
    },
    {
      build: patternGapCase('ArrayPattern', false),
      shape: 'array pattern, last gap closed',
    },
  ],
  'export-specifier-newline': [
    {
      build: exportJoinedCase,
      shape: 'specifiers joined onto one line',
    },
    {
      build: exportPairCase('local'),
      shape: 'second specifier added to a local export',
    },
    {
      build: exportPairCase('from'),
      shape: 'second specifier added to a re-export',
    },
    {
      build: exportPairCase('type'),
      shape: 'second specifier added to a type-only export',
    },
  ],
  'import-newlines': [
    {
      build: importJoinedCase,
      shape: 'joined onto one line, over the item limit',
    },
    {
      build: importSplitCase,
      shape: 'split one per line, under the item limit',
    },
    {
      build: importLongLineCase,
      shape: 'padded past maxLineLength',
    },
    {
      build: importTailJoinedCase,
      shape: 'two members left sharing a line',
    },
    {
      build: importBlankLineCase,
      shape: 'blank line between two members',
    },
  ],
  'interface-order': [
    {
      build: typeBelowRuntimeCase('imports'),
      shape: 'type moved below runtime code, under imports',
    },
    {
      build: typeBelowRuntimeCase('directive'),
      shape: 'type moved below runtime code, under a directive',
    },
    {
      build: typeBelowRuntimeCase('none'),
      shape: 'type moved below runtime code, no header',
    },
  ],
  'newline-destructuring': [
    {
      build: patternJoinedCase(false),
      shape: 'pattern joined onto one line, over maxProperties',
    },
    {
      build: patternJoinedCase(true),
      shape: 'pattern with a rest element joined onto one line',
    },
    {
      build: patternSplitCase,
      shape: 'pattern at the threshold split across lines',
    },
    {
      build: patternBlankLineCase,
      shape: 'blank line between two properties',
    },
    {
      build: typeMembersJoinedCase('TSInterfaceBody', 'body'),
      shape: 'interface body joined onto one line',
    },
    {
      build: typeMembersJoinedCase('TSTypeLiteral', 'members'),
      shape: 'type literal joined onto one line',
    },
  ],
  'no-import-namespace-destructure': [
    {
      build: namespaceDestructureCase('module'),
      shape: 'destructured at module scope',
    },
    {
      build: namespaceDestructureCase('function'),
      shape: 'destructured inside a function body',
    },
    {
      build: namespaceDestructureCase('block'),
      shape: 'destructured inside a nested block',
    },
  ],
  'prefer-arrow-functions': [
    {
      build: functionDeclarationCase,
      shape: 'rewritten as a function declaration',
    },
    {
      build: functionExpressionCase,
      shape: 'rewritten as a function expression',
    },
    {
      build: propertyFunctionCase(false),
      shape: 'rewritten as a long-form property value',
    },
    {
      build: propertyFunctionCase(true),
      shape: 'rewritten as a shorthand method',
    },
    {
      build: defaultExportFunctionCase,
      shape: 'rewritten as an anonymous default export',
    },
    {
      build: expressionBodyCase,
      shape: 'block body collapsed to an expression body',
    },
  ],
  'prefer-await-to-then': [
    {
      build: detachedHandlerCase('then'),
      shape: 'detached .then() in statement position',
    },
    {
      build: detachedHandlerCase('catch'),
      shape: 'detached .catch() in statement position',
    },
    {
      build: detachedHandlerCase('finally'),
      shape: 'detached .finally() in statement position',
    },
    {
      build: strictAwaitedHandlerCase,
      options: { strict: true },
      shape: 'awaited .then() under strict',
    },
  ],
  'prefer-destructured-props': [
    {
      build: arrowComponentCase,
      shape: 'arrow assigned to an uppercase const, rewritten to a props parameter',
    },
    {
      build: functionDeclarationComponentCase,
      shape: 'function declaration, rewritten to a props parameter',
    },
  ],
  'prefer-try-catch': [
    {
      build: awaitedHandlerCase(`.catch(${PROBE_HANDLER})`),
      shape: 'rejection handler on an await',
    },
    {
      build: awaitedHandlerCase(`.then(lintelFulfilProbe, ${PROBE_HANDLER})`),
      shape: 'two-argument .then() on an await',
    },
    {
      build: awaitedHandlerCase(`.catch(${PROBE_HANDLER}).then(lintelParseProbe)`),
      shape: 'rejection handler buried mid-chain',
    },
    {
      build: asyncReturnHandlerCase,
      shape: 'rejection handler on an async return',
    },
  ],
  'sort-hook-dependencies': [
    {
      build: hookOrderCase(DEFAULT_HOOKS, 'desc'),
      shape: 'dependencies sorted the wrong way',
    },
    {
      build: hookOrderCase(DEFAULT_HOOKS, 'asc'),
      options: { order: 'desc' },
      shape: 'dependencies sorted ascending under order: desc',
    },
    {
      build: hookOrderCase(EXTRA_HOOKS, 'desc'),
      options: { hooks: EXTRA_HOOKS },
      shape: 'dependencies of a hook named by the hooks option',
    },
  ],
  'union-newline': [
    {
      build: unionWithMemberCase('({ lintelProbeMember: string })'),
      shape: 'union with an object member',
    },
    {
      build: unionWithMemberCase('(() => void)'),
      shape: 'union with a function member',
    },
    {
      build: unionWithMemberCase('(new () => LintelProbe)'),
      shape: 'union with a constructor member',
    },
    {
      build: unionWithMemberCase('({ [K in LintelProbeKeys]: string })'),
      shape: 'union with a mapped member',
    },
    {
      build: unionGenericCase,
      shape: 'four plain members inside a generic argument',
    },
  ],
};

// ---------------------------------------------------------------------- run

const shapedRules = Object.keys(SHAPES);
const unshapedRules = PLUGIN_RULES.filter((rule) => {
  return !shapedRules.includes(rule);
});

// A rule with no shapes is a gap in this audit, not a reason to fail it: what it can exercise, it still exercises.
// Said loudly on every run so the gap cannot go quiet the way it did when it presented as a crash instead.
if (unshapedRules.length > 0) {
  console.log(`! no false-negative shapes, so not audited: ${unshapedRules.join(', ')}`);
}

const selectedRules = activeRules ?? shapedRules;
const unknownRules = selectedRules.filter((rule) => {
  return !shapedRules.includes(rule);
});

if (unknownRules.length > 0) {
  console.error(`No shapes for: ${unknownRules.join(', ')}. Add one to SHAPES or drop --rule.`);
  process.exit(1);
}

const activeShapes = selectedRules.flatMap((rule) => {
  return SHAPES[rule].map((entry) => {
    return {
      ...entry,
      key: `${rule} :: ${entry.shape}`,
      rule,
    };
  });
}).filter((entry) => {
  return onlyShape === undefined || entry.shape.includes(onlyShape);
});

if (activeShapes.length === 0) {
  console.error(`no shape matches: ${onlyShape}`);
  process.exit(2);
}

const emptyStats = () => {
  return {
    attempts: 0,
    cases: 0,
    misses: [],
    seen: 0,
    skips: new Map(),
  };
};

const stats = new Map(activeShapes.map((entry) => {
  return [entry.key, emptyStats()];
}));

const noteSkip = (key, reason) => {
  const skips = stats.get(key).skips;
  skips.set(reason, (skips.get(reason) ?? 0) + 1);
};

const lineAt = (source, offset) => {
  return countMatches(source.slice(0, offset), /\n/g) + 1;
};

const snippetAt = (source, offset) => {
  const line = lineAt(source, offset);
  return source.split('\n').slice(Math.max(0, line - 2), line + 3).join('\n');
};

const describeShape = (entry) => {
  return entry.options ? `${entry.shape} ${JSON.stringify(entry.options)}` : entry.shape;
};

const showMiss = (entry, file, miss) => {
  console.log(`\n! false negative: @linteljs/${entry.rule}`);
  console.log(`  shape: ${describeShape(entry)}`);
  console.log(`  ${file}`);
  console.log('  the file was silent for this rule, the edit below broke it, and it stayed silent');
  console.log('  transformed source:');

  for (const line of miss.snippet.split('\n')) {
    console.log(`    ${line}`);
  }
};

// The file's own report count for one rule and option set, computed at most once however many shapes ask for it.
// Six shapes of one rule on one file would otherwise pay for six identical passes.
const silentBefore = (cache, entry, source, name) => {
  const key = `${entry.rule}|${JSON.stringify(entry.options ?? null)}`;
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const result = reportsFor(source, name, entry.rule, entry.options);
  cache.set(key, result);

  return result;
};

// One shape against one file: build the violating edit, then insist on a report. The original must be silent
// first, which is what makes any report afterwards attributable to the edit and nothing else.
const attempt = (entry, file, state, name, cache) => {
  const candidate = entry.build(state);

  if (!candidate) {
    return;
  }

  const bucket = stats.get(entry.key);
  bucket.attempts += 1;

  const before = silentBefore(cache, entry, state.source, name);

  if (before.fatal) {
    noteSkip(entry.key, 'file does not lint cleanly under this parser');
    return;
  }

  if (before.count > 0) {
    noteSkip(entry.key, 'file already reports for this rule, so silence would prove nothing');
    return;
  }

  const after = reportsFor(candidate.source, name, entry.rule, entry.options);

  if (after.fatal) {
    noteSkip(entry.key, 'transformation produced invalid syntax');
    return;
  }

  bucket.cases += 1;

  if (after.count > 0) {
    bucket.seen += 1;
    return;
  }

  const miss = {
    file,
    snippet: snippetAt(candidate.source, candidate.offset),
  };
  bucket.misses.push(miss);
  showMiss(entry, file, miss);
};

const counts = {
  duplicate: 0,
  scanned: 0,
  skipped: 0,
  unparsed: 0,
};
const seen = new Set();

const shapesStillHungry = () => {
  return activeShapes.filter((entry) => {
    return stats.get(entry.key).cases < casesWanted;
  });
};

const check = (file, hungry) => {
  const source = readFileSync(file, 'utf8');

  if (skipReason(source)) {
    counts.skipped += 1;
    return;
  }

  const digest = createHash('sha256').update(source).digest('hex');

  if (seen.has(digest)) {
    counts.duplicate += 1;
    return;
  }

  seen.add(digest);

  const name = nameFor(file, source);
  const ast = parseOrNull(source, name);

  if (!ast) {
    counts.unparsed += 1;
    return;
  }

  counts.scanned += 1;

  // One walk, however many shapes are still looking. Only the skip sink differs per shape, so the index, the
  // parent links and the answer to whether the file was silent to begin with are all shared.
  const index = indexAst(ast);
  const cache = new Map();

  for (const entry of hungry) {
    if (TS_ONLY_RULES.has(entry.rule) && !isTypeScript(name)) {
      continue;
    }

    attempt(entry, file, {
      ast,
      index,
      source,
      skip: (reason) => {
        return noteSkip(entry.key, reason);
      },
    }, name, cache);
  }
};

const files = interleave(sources.map((dir) => {
  return walk(dir, dir.includes('node_modules'), []);
})).slice(0, maxFiles);

console.log(`• ${files.length} files under:`);

for (const dir of sources) {
  console.log(`    ${dir}`);
}

console.log(`• rules: ${selectedRules.join(', ')}`);
console.log(`• shapes: ${activeShapes.length} distinct ways of breaking them`);
console.log(`• target: ${casesWanted} transformed cases per shape`);

if (neuteredRule) {
  console.log(`• NEUTERED: @linteljs/${neuteredRule} is stubbed to report nothing, every case must miss`);
}

console.log('');

let visited = 0;
let lastPrint = Date.now();

for (const file of files) {
  const hungry = shapesStillHungry();

  if (hungry.length === 0) {
    break;
  }

  visited += 1;

  try {
    check(file, hungry);
  }
  catch (error) {
    // One pathological file must not end the run, and a crash inside a rule is
    // exactly the kind of thing a harness like this exists to surface.
    console.log(`\n! threw: ${file}`);
    console.log(`  ${String(error?.message ?? error).split('\n')[0].slice(0, 160)}`);
  }

  if (Date.now() - lastPrint > 3000) {
    const done = activeShapes.length - shapesStillHungry().length;
    console.log(`  ${visited}/${files.length} files, ${counts.scanned} linted, `
      + `${done}/${activeShapes.length} shapes full`);
    lastPrint = Date.now();
  }
}

console.log(`\n${counts.scanned} files linted, skipped ${counts.skipped} oversized, minified, compiled or `
  + `already-disabled, ${counts.duplicate} duplicates, ${counts.unparsed} the parser rejected\n`);

// `attempted` counts the edits built, `skipped` every candidate declined, including those declined before an edit
// existed. The second can be larger, and on a rule that declines most of what it is offered it usually is.
console.log('per shape: attempted, skipped, expected, seen, missed\n');

let missed = 0;
let starved = 0;

for (const rule of selectedRules) {
  const shapes = activeShapes.filter((entry) => {
    return entry.rule === rule;
  });

  if (shapes.length === 0) {
    continue;
  }

  console.log(`@linteljs/${rule}`);

  for (const entry of shapes) {
    const bucket = stats.get(entry.key);
    missed += bucket.misses.length;
    starved += bucket.cases === 0 ? 1 : 0;

    const skipped = [...bucket.skips.values()].reduce((total, count) => {
      return total + count;
    }, 0);

    console.log(`  ${describeShape(entry)}`);
    console.log(`    ${bucket.attempts} attempted, ${skipped} skipped, ${bucket.cases} expected, `
      + `${bucket.seen} seen, ${bucket.misses.length} missed`);

    for (const [reason, count] of [...bucket.skips].sort((left, right) => {
      return right[1] - left[1];
    })) {
      console.log(`    skipped ${count}: ${reason}`);
    }
  }
}

if (starved > 0) {
  console.log(`\n${starved} shape(s) got no transformed case at all. That is not a pass; widen the corpus.`);
}

if (missed === 0) {
  console.log('\n✓ every deliberately broken input was reported');
}
else {
  console.log(`\n${missed} false negative(s)`);
  console.log('Read the transformations before reading these as rule defects. A large count is a broken');
  console.log('edit far more often than it is a broken rule.');
}

process.exitCode = missed > 0 || starved > 0 ? 1 : 0;
