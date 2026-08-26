import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { targetFor } from '../../model/targets';
import { writeProjectFile } from '../project-files/projectFiles';
import { isAbsence } from '../utils/fsUtils';

import type { Answers } from '../../model/answers/answers';

// Always rewrite `src/`: non-compiling generator output is not a project decision.
export const SOURCE_ROOT = 'src';

const SCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

// Keep `.d.ts` extensions, which are part of their specifier.
const RELATIVE_TS_IMPORT
  = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"\n]*?)(?<!\.d)\.[cm]?tsx?\2/g;

const IMPORT_CLAUSE = /import\s+\{([^}]*)\}\s+from\s+(['"])([^'"]+)\2/g;

// Remove relative TypeScript extensions instead of enabling the bundler-only tsconfig escape hatch.
export const stripTsExtensions = (source: string): string => {
  return source.replace(RELATIVE_TS_IMPORT, '$1$2$3$2');
};

// Angular needs per-specifier `type` modifiers because mixed clauses fail `verbatimModuleSyntax`.
export const markTypeOnlyImports = (
  source: string,
  typeOnly: Record<string, string[]>,
): string => {
  return source.replace(IMPORT_CLAUSE, (clause, specifiers: string, quote: string, module: string) => {
    const names = typeOnly[module];

    if (names === undefined) {
      return clause;
    }

    const rewritten = specifiers.split(',').map((specifier) => {
      const name = specifier.trim();
      return names.includes(name) ? specifier.replace(name, `type ${name}`) : specifier;
    });

    return `import {${rewritten.join(',')}} from ${quote}${module}${quote}`;
  });
};

// Limit the rewrite to literal `document` lookups, not arbitrary assertions or side effects.
const DOM_LOOKUP_ASSERTION
  = /document\.(getElementById|querySelector)(<[^>]+>)?\((['"])([^'"]+)\3\)!/g;

const HOISTED_LOOKUP = new RegExp(
  [
    '^([ \\t]*)const\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*',
    'document\\.(?:getElementById|querySelector)\\(([\'"])([^\'"]+)\\3\\);?[ \\t]*$',
  ].join(''),
  'm',
);

// `getElementById('root')` looks for `#root`; `querySelector('#app')` already reads as one.
const asSelector = (method: string, argument: string): string => {
  return method === 'getElementById' ? `#${argument}` : argument;
};

const guardFor = (name: string, selector: string, indent: string): string => {
  return [
    `${indent}if (!${name}) {`,
    `${indent}  throw new Error('Element ${selector} not found');`,
    `${indent}}`,
  ].join('\n');
};

// Replace known template mount assertions with a selector-naming guard; leave other shapes untouched.
export const guardMountLookups = (source: string): string => {
  // Solid's template hoists the lookup and asserts at the use site instead, so it needs its own branch.
  const hoisted = HOISTED_LOOKUP.exec(source);

  if (hoisted) {
    const [line, indent = '', name = '', , argument = ''] = hoisted;
    const method = line.includes('getElementById') ? 'getElementById' : 'querySelector';

    // Re-runs under `--skip-scaffold` must not stack guards.
    const guarded = new RegExp(`if\\s*\\(!${name}\\b`).test(source)
      ? source
      : source.replace(line, `${line}\n\n${guardFor(name, asSelector(method, argument), indent)}`);

    // Only the asserted uses lose their `!`; an unasserted read of the same binding is untouched.
    return guarded.replaceAll(new RegExp(`\\b${name}!`, 'g'), name);
  }

  // Split rather than a multiline regex: matching indent and body in one pattern makes the two
  // halves ambiguous, and it backtracks across every line of a long template.
  return source.split('\n').map((line) => {
    const matches = [...line.matchAll(DOM_LOOKUP_ASSERTION)];

    if (matches.length === 0) {
      return line;
    }

    /**
     * Each match is hoisted above its line, correct even inside a template literal since every occurrence here starts
     * the statement containing it. The indent is sliced rather than matched: `/^[ \t]*\/` always matches (leaving
     * `?? ''` unreachable) and the inverse pattern backtracks (`sonarjs/super-linear-regex`).
     */
    const indent = line.slice(0, line.length - line.trimStart().length);
    const declarations: string[] = [];

    const rewritten = matches.reduce((text, [expression, method = '', , , argument = '']) => {
      // `#app` -> `app`, `root` -> `root`: a non-identifier character cannot reach a binding.
      const name = argument.replace(/[^\w$]/g, '');

      declarations.push(
        `${indent}const ${name} = ${expression.slice(0, -1)};`,
        '',
        guardFor(name, asSelector(method, argument), indent),
        '',
      );

      return text.replace(expression, name);
    }, line);

    return [...declarations, rewritten].join('\n');
  }).join('\n');
};

export const sourceFiles = async (root: string): Promise<string[]> => {
  try {
    const entries = await readdir(root, {
      withFileTypes: true,
      recursive: true,
    });

    return entries
      .filter((entry) => {
        return entry.isFile() && SCRIPT_EXTENSIONS.has(extname(entry.name));
      })
      .map((entry) => {
        return join(entry.parentPath, entry.name);
      });
  }
  catch (error) {
    // No `src/` (`--skip-scaffold` against a repo keeping source elsewhere) is not an error; other failures still are.
    if (isAbsence(error)) {
      return [];
    }

    throw error;
  }
};

// The entry module a bundler mounts from (`main`/`index` directly under `src/`); confined to it since the pattern is
// legitimate to write by hand and `--skip-scaffold` points this pass at a long-lived repository.
const isMountEntry = (path: string, root: string): boolean => {
  const relative = path.slice(root.length + 1);

  return !relative.includes('/') && /^(?:main|index)\.[cm]?tsx?$/.test(relative);
};

export const rewriteScaffoldedSource = async (
  cwd: string,
  answers: Answers,
  onWrite?: (path: string) => void,
): Promise<void> => {
  const { typeOnlyImports } = targetFor(answers);
  const root = join(cwd, SOURCE_ROOT);

  for (const path of await sourceFiles(root)) {
    const before = await readFile(path, 'utf8');
    const extensionless = stripTsExtensions(before);
    const typed = typeOnlyImports === undefined
      ? extensionless
      : markTypeOnlyImports(extensionless, typeOnlyImports);
    const after = isMountEntry(path, root) ? guardMountLookups(typed) : typed;

    if (after !== before) {
      const target = path.slice(cwd.length + 1);

      await writeProjectFile(cwd, target, after);
      onWrite?.(target);
    }
  }
};
