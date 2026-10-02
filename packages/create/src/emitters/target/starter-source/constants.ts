export const CODE_EXTENSION = /\.[cm]?[jt]sx?$/v;

export const RELATIVE_SPECIFIER = /(?<quote>['"])(?<specifier>\.\.?\/[^'"\n]+)\k<quote>/gv;

export const NOT_DOTTED = /^(?!\.)/v;

export const USE_CLIENT = "'use client';\n\n";
