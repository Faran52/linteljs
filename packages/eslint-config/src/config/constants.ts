// The TypeScript half on its own, because a rule that reads a TypeScript node has nothing to do in a `.js` file.
export const TYPESCRIPT_EXTENSIONS = 'ts,tsx,mts,cts';

export const SCRIPT_EXTENSIONS = `js,jsx,mjs,cjs,${TYPESCRIPT_EXTENSIONS}`;

// Every file a script parser owns outright, which is what a framework whose components are JSX scopes itself to.
export const SCRIPT_FILES = [`**/*.{${SCRIPT_EXTENSIONS}}`];

// The same, plus the two single-file component extensions whose `<script>` block is one of the above.
export const SCRIPT_AND_SFC_FILES = [`**/*.{${SCRIPT_EXTENSIONS},vue,svelte}`];
