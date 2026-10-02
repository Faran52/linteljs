// The typecheck runs the whole project and keeps diagnostics naming a staged file: no per-file typecheck is correct.
// `.vue` and `.svelte` share the glob, so a component script meets the same gates as a `.ts` file.
const config = {
  '*.{ts,tsx,mts,cts,vue,svelte}': (stagedFiles) => {
    const files = stagedFiles.join(' ');

    const commands = [
      `node scripts/checkBannedPatterns.ts ${files}`,
      `eslint ${files} --fix`,
      `node scripts/typecheckStaged.ts ${files}`,
    ];

    return commands;
  },
  '*.{css,scss,vue,svelte}': ['stylelint --fix'],
};

export default config;
