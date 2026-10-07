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
