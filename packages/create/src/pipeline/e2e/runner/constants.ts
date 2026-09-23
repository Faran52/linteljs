// What an install prints that says nothing about the project this suite generated.

/**
 * Never asserted on, for any manager. A deprecation notice reports that a third-party package reached end of life,
 * which is true of trees this CLI does not choose: `expo` reaches a deprecated `uuid` through the Xcode writer, and
 * a scaffolder installs `expo`, not linteljs. No emitted config makes it go away, and muting it in a generated project
 * would hide a real fact from whoever does own the dependency.
 */
export const DEPRECATION = /deprecated/i;

/**
 * What yarn 1 says about somebody else's manifest. It walks every installed package and reports a `workspaces`
 * field on one that is not private, and an `engines` key it does not know, and neither is a fact a generated
 * project owns or can change: the project itself is private and declares only `node` and its own manager.
 */
export const YARN_CLASSIC_UPSTREAM = new RegExp([
  'Workspaces can only be enabled in private projects',
  'The engine "[^"]+" appears to be invalid',
].join('|'));
