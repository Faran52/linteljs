import { dirname, join } from 'node:path';

import ts from 'typescript';

export interface Placement {
  // `<asset> -> <destination>` over every target.
  readonly placed: ReadonlyMap<string, string>;
  // Per target, every path a relative import may reach.
  readonly covered: ReadonlyMap<string, ReadonlySet<string>>;
}

// A program answers what ESLint cannot: does every name and relative import resolve? `no-undef` is off under
// typescript-eslint, and a `declare module '*'` would swallow a misspelled relative import.
const UNRESOLVED = new Set([
  2304, // Cannot find name
  2307, // Cannot find module, kept for a relative specifier only
  2339, // Property does not exist on type
  2503, // Cannot find namespace
  2552, // Cannot find name, did you mean
  2593, // Cannot find name, do you need the test runner's types
  2686, // refers to a UMD global, but the current file is a module
  2694, // Namespace has no exported member
]);

// Three programs because `@types/chrome` and `@types/firefox-webext-browser` are mutually exclusive.
const SCOPES: [string, string[]][] = [
  ['webextension/chrome', ['chrome', 'vitest/globals']],
  ['webextension/firefox', ['firefox-webext-browser', 'vitest/globals']],
  ['', ['react', 'vitest/globals']],
];

const OPTIONS: ts.CompilerOptions = {
  noEmit: true,
  strict: true,
  skipLibCheck: true,
  allowJs: true,
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
};

const assetOf = (fileName: string): string => {
  return fileName.split('templates/')[1] ?? fileName;
};

const withoutExtension = (path: string): string => {
  return path.replace(/\.[cm]?[jt]sx?$/, '');
};

// A bare specifier names a package not installed here. A relative one may only miss the module a scaffolder writes.
const resolvesElsewhere = (diagnostic: ts.Diagnostic, { placed, covered }: Placement): boolean => {
  const start = diagnostic.start ?? 0;
  const specifier = diagnostic.file?.text.slice(start + 1, start + (diagnostic.length ?? 0) - 1) ?? '';

  if (!specifier.startsWith('.')) {
    return true;
  }

  const asset = assetOf(diagnostic.file?.fileName ?? '');
  const destination = placed.get(asset);

  if (destination === undefined) {
    return false;
  }

  const wanted = withoutExtension(join(dirname(destination), specifier));

  // A directory specifier resolves to its `index`.
  return [...covered.get(asset.split('/')[1] ?? '') ?? []]
    .some((path) => {
      const declared = withoutExtension(path);

      return declared === wanted || declared === join(wanted, 'index');
    });
};

const diagnose = (files: string[], types: string[], placement: Placement): string[] => {
  const program = ts.createProgram(files, {
    ...OPTIONS,
    types,
  });

  return ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => {
      return UNRESOLVED.has(diagnostic.code)
        && diagnostic.file !== undefined
        && (diagnostic.code !== 2307 || !resolvesElsewhere(diagnostic, placement));
    })
    .map((diagnostic) => {
      const line = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line ?? 0;
      const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');

      return `${assetOf(diagnostic.file?.fileName ?? '')}:${String(line + 1)} TS${String(diagnostic.code)}  ${text}`;
    });
};

export const unresolvedNames = (root: string, files: string[], placement: Placement): string[] => {
  return SCOPES
    .flatMap(([scope, types]) => {
      const own = files
        .filter((file) => {
          const match = SCOPES
            .find(([prefix]) => {
              return prefix !== '' && file.startsWith(join(root, prefix));
            });

          return (match?.[0] ?? '') === scope;
        });

      return own.length === 0 ? [] : diagnose(own, types, placement);
    });
};
