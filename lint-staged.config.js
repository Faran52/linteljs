// The glob drops `tsx`, `vue` and `svelte`: here they are only template text for frameworks not installed.
const config = {
  '*.{ts,mts,cts}': (stagedFiles) => {
    const files = stagedFiles.join(' ');

    return [
      `node scripts/checkBannedPatterns.ts ${files}`,
      `eslint ${files} --fix`,
      `node packages/create/templates/project/scripts/typecheckStaged.ts ${files}`,
    ];
  },
  '*.css': ['stylelint --fix'],
};

export default config;
