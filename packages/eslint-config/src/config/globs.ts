// The TypeScript half on its own, because a rule that reads a TypeScript node has nothing to do in a `.js` file.
export const TYPESCRIPT_EXTENSIONS = 'ts,tsx,mts,cts';

export const SCRIPT_EXTENSIONS = `js,jsx,mjs,cjs,${TYPESCRIPT_EXTENSIONS}`;
