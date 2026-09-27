// The typecheck runs the whole project and keeps diagnostics naming a staged file: no per-file typecheck is correct.
// `.vue` and `.svelte` share the glob: leaving SFCs out let `as never` in `<script setup>` pass every gate.
const config = {
  '*.{ts,tsx,mts,cts,vue,svelte}': (stagedFiles) => {
    const files = stagedFiles.join(' ');

    return [
      `node scripts/checkBannedPatterns.ts ${files}`,
      `eslint ${files} --fix`,
      `node scripts/typecheckStaged.ts ${files}`,
    ];
  },
  '*.{css,scss,vue,svelte}': ['stylelint --fix'],
};

export default config;
