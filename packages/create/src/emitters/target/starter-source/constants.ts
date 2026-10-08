export const CODE_EXTENSION = /\.[cm]?[jt]sx?$/v;

export const RELATIVE_SPECIFIER = /(?<quote>['"])(?<specifier>\.\.?\/[^'"\n]+)\k<quote>/gv;

export const NOT_DOTTED = /^(?!\.)/v;

export const USE_CLIENT = "'use client';\n\n";

export const STYLEX_PROPS = 'stylex.props';

export const STYLEX_ATTRS = 'stylex.attrs';

// A suite several targets share is written for vitest; jest has the same globals, under `jest` and unimported.
export const VITEST_IMPORT = /^import \{[^\}]*\} from 'vitest';\n/mv;

export const VI_MEMBER = /\bvi\./gv;

// Jest has no `stubGlobal`; a spy on the global is restored with every other one.
export const STUB_GLOBAL = /\bvi\.stubGlobal\('(?<name>\w+)', (?<value>\w+)\)/gv;

// Nuxt auto-imports these, so its dialect of a shared Vue source drops their imports.
export const AUTO_IMPORTED: Readonly<Record<string, readonly string[]>> = {
  'vue': ['computed', 'ref'],
  'vue-router': ['useRoute'],
};

// From this many specifiers on, an import lists one per line, as the import style asks.
export const MULTILINE_SPECIFIERS = 3;

export const NAMED_IMPORT = /^import \{(?<names>[^\}]*)\} from '(?<from>[^']+)';\n/gmv;

export const COMPONENT_IMPORT = /^import \w+ from '(?<from>[^']+\.vue)';\n/gmv;

// Nuxt registers every component under `src/components/`, reached through these aliases or relatively within it.
export const REGISTERED_COMPONENT = /^(?:@ui|@features|\.\.?)\//v;

export const EXTRA_BLANK_LINES = /\n{3,}/gv;

export const BLANK_AFTER_SCRIPT_TAG = /(?<tag><script[^>]*>\n)\n+/gv;
