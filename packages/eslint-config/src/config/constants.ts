export const TYPESCRIPT_EXTENSIONS = 'ts,tsx,mts,cts';

export const SCRIPT_EXTENSIONS = `js,jsx,mjs,cjs,${TYPESCRIPT_EXTENSIONS}`;

export const SCRIPT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

export const SCRIPT_AND_SFC_FILES = [`**/*.{${SCRIPT_EXTENSIONS},vue,svelte}`];
