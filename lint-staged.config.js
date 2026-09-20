/**
 * The three passes a generated project runs, cheapest failure first. The glob drops `tsx`, `vue` and
 * `svelte`, and stylelint sees only `*.css`: those extensions exist here as shipped template text under
 * `packages/create/templates/`, written for frameworks this workspace does not install.
 */
const config = {
  '*.{ts,mts,cts}': (stagedFiles) => {
    const files = stagedFiles.join(' ');

    return [
      `node scripts/checkBannedPatterns.ts ${files}`,
      `eslint ${files} --fix`,
      `node scripts/typecheckStaged.ts ${files}`,
    ];
  },
  '*.css': ['stylelint --fix'],
};

export default config;
