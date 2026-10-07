---
paths:
  - "packages/eslint-config/**/*"
---

# `@linteljs/eslint-config` structure

- **Grouped by what a layer is**: `layers/<name>/<name>Layer.ts` for `base`, `typescript`, `vitest`, `jest` and `html`;
  `frameworks/<name>/<name>Framework.ts` for the nine frameworks; `libraries/<name>/<name>Library.ts` for
  `stylex`, `tailwind`, `tanstack-query` and `tanstack-router`. Each has its suite beside it.
- **The suffix is on the file, not the export**: `baseLayer.ts` exports `base`.
- **`compose-config/composeConfig.ts`** composes the layers and owns their order, which is load-bearing. It takes
  no suffix, since nothing names a kind for it. Its loader tables are functions, so they sit in
  `compose-config/utils/loaderUtils.ts`, not a `constants.ts`.
- **Shared code**: `config/constants.ts` holds the glob and extension tables several layers read;
  `frameworks/utils/reactCoreUtils.ts` what several frameworks read; `layers/base/utils/` the naming and
  import-sort builders only `base` reads; `utils/presetUtils.ts` what the whole package reads. A shared table is
  data, so it never goes in `utils/`.
- **`index.ts` and `types.ts`** stay at the root as the package's entry points.
- **Every entry backs a published `exports` subpath** through a keyed tsdown entry, so `dist/` stays flat however
  deep the source sits (`dist/reactNative.mjs`). `src/meta.test.ts` holds the tree, and the tsdown entries one to
  one against `exports`; `scripts/smoke/smokeScript.ts` resolves every subpath against the packed tarball.
- **Tests lint real text** through a real `ESLint` (`__mocks__/lintText.ts`), with defective input in
  `__mocks__/fixtures/`, never by reading the config object back.
