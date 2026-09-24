// What an install prints that says nothing about the project this suite generated.

/**
 * Never asserted on, for any manager. A deprecation notice reports that a package deep in somebody else's tree reached
 * end of life: `expo` reaches a deprecated `uuid` through the Xcode writer. No emitted config makes it go away, and
 * muting it in a generated project would hide a real fact from whoever does own the dependency.
 */
export const DEPRECATION = /deprecated/i;

/**
 * What yarn 1 says about somebody else's manifest. It walks every installed package and reports a `workspaces`
 * field on one that is not private, and an `engines` key it does not know, and neither is a fact a generated
 * project owns or can change: the project itself is private and declares only `node` and its own manager.
 *
 * It also reports every peer a dependency's own parent does not declare: `@vue/test-utils` asking for the
 * `@vue/compiler-dom` that `vue` ships, rolldown behind `@rolldown/plugin-babel` and `nuxt`, which Vite bundles. Yarn 4
 * is told which of those are optional through `packageExtensions` in the emitted `.yarnrc.yml`; yarn 1 has no such
 * file, so the warning is the one it gives however the project is written. A peer that is truly missing does not hide
 * here: the project's own `check` runs against the tree, and fails.
 *
 * And it prints a deprecation as the package's own message after its path, `a > b > glob@10.5.0: Old versions...`,
 * with no word to match `DEPRECATION` on.
 */
export const YARN_CLASSIC_UPSTREAM = new RegExp([
  'Workspaces can only be enabled in private projects',
  'The engine "[^"]+" appears to be invalid',
  '" has unmet peer dependency "',
  '^warning (?:[^ ]+ > )*[^ ]+@[^ :]+: ',
].join('|'));
