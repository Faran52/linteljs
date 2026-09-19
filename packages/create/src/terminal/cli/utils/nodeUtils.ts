import { NODE_ENGINE } from '../../../config/constants';

// `26.9.0` becomes 26_009_000, so one comparison answers it. No field of a Node version comes near a thousand, and
// this is the whole of the semver support a floor of `>=x.y.z` needs; a range with an upper bound would not be.
const rankOf = (version: string): number => {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map((field) => {
    return Number.parseInt(field, 10);
  });

  return major * 1_000_000 + minor * 1_000 + patch;
};

/**
 * The floor a generated project declares in its own `engines`, so this CLI refuses on the same line the project's
 * first install would. Answers the message rather than throwing, like `argumentError` beside it, because it runs
 * before the questionnaire: nobody should answer a dozen questions and then be told their Node is too old.
 *
 * The running version is a parameter so the refusal is testable without a second Node on the machine.
 */
export const nodeVersionRefusal = (running: string): string | undefined => {
  const floor = NODE_ENGINE.replace(/^[>=~^]+/, '');

  return rankOf(running) < rankOf(floor)
    ? `Node ${running} is running this, and @linteljs/create needs Node ${floor} or newer. `
    + 'Install it from https://nodejs.org and run this again.'
    : undefined;
};
