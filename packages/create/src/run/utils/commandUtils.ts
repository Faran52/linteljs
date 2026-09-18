import { spawnSync } from 'node:child_process';

import { NODE_ENGINE, PACKAGE_MANAGER_VERSIONS } from '../../emitters/config/versions';

import type { PackageManager } from '../../answers/answers';

export const isCommandAvailable = (command: string): boolean => {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
};

// The same `--version` call, keeping what it printed: presence and version are one question, so they are one spawn.
const installedVersion = (command: string): string | undefined => {
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return result.status === 0 ? result.stdout.trim() : undefined;
};

const runOrThrow = (command: string, args: string[]): void => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stdout}${result.stderr}`);
  }
};

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
 * first install would. Answers the message rather than throwing, like `argumentError`, because it runs before the
 * questionnaire: nobody should answer a dozen questions and then be told their Node is too old.
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

// Yarn prints `1.22.22`, pnpm and bun a bare version, npm the same; the major is the first field of all four.
const majorOf = (version: string): number => {
  return Number.parseInt(version, 10);
};

// corepack knows npm, pnpm and yarn; `corepack install -g bun` is not a thing.
const installHint = (pm: PackageManager, version: string): string => {
  return pm === 'bun'
    ? 'Install it from https://bun.sh and run this again.'
    : `Install it with \`corepack install -g ${pm}@${version}\` and run this again.`;
};

/**
 * Node 26 no longer bundles corepack, so a missing pnpm or yarn is installed through it; bun has no corepack shim.
 *
 * A manager that is present but older is refused rather than upgraded. Upgrading would change the global manager of
 * someone who runs an older one on purpose, which is not this CLI's to decide; and doing nothing is worse than both,
 * because the scaffold then runs under a major that cannot read its own flags. Yarn 1 is the case that made this
 * real: it is still on a great many machines, `yarn create` means something different there, and the only symptom
 * was `exited with 127` several stages later.
 */
export const ensurePackageManager = (pm: PackageManager, notice: (message: string) => void): void => {
  const installed = installedVersion(pm);
  const required = PACKAGE_MANAGER_VERSIONS[pm];

  if (installed === undefined) {
    if (pm === 'bun') {
      throw new Error(`bun is not installed. ${installHint(pm, required)}`);
    }

    notice(`Installing ${pm} via corepack...`);

    if (!isCommandAvailable('corepack')) {
      runOrThrow('npm', ['install', '-g', 'corepack']);
    }

    runOrThrow('corepack', ['enable']);
    runOrThrow('corepack', ['install', '-g', pm]);

    return;
  }

  if (majorOf(installed) < majorOf(required)) {
    throw new Error(
      `${pm} ${installed} is on PATH, and a project this CLI writes declares ${pm} ${required}. `
      + installHint(pm, required),
    );
  }
};
