import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  acceptsManager,
  managerFromUserAgent,
  managerRefusal,
  nodeRefusal,
  unversionedRefusal,
  yarnFromLockfile,
} from './hostUtils';

describe('managerFromUserAgent', () => {
  // The four agents a real run sees. pnpm's carries `node/?` rather than a version, which is why the version is
  // read off the first token alone and not off the rest of the line.
  it('reads the name and version off the first token', () => {
    expect(managerFromUserAgent('pnpm/12.5.1 npm/? node/? darwin arm64')).toEqual({
      name: 'pnpm',
      version: '12.5.1',
    });
    expect(managerFromUserAgent('npm/11.19.1 node/v26.9.0 darwin arm64 workspaces/false')).toEqual({
      name: 'npm',
      version: '11.19.1',
    });
    expect(managerFromUserAgent('yarn/1.22.22 npm/? node/v26.9.0 darwin arm64')).toEqual({
      name: 'yarn-classic',
      version: '1.22.22',
    });
    expect(managerFromUserAgent('yarn/4.18.0 npm/? node/v26.9.0 darwin arm64')).toEqual({
      name: 'yarn',
      version: '4.18.0',
    });
    expect(managerFromUserAgent('bun/1.3.14 npm/? node/v24.3.0 darwin arm64')).toEqual({
      name: 'bun',
      version: '1.3.14',
    });
  });

  it('answers nothing for an unset agent or a runtime that is not one of the four', () => {
    expect(managerFromUserAgent(undefined)).toBeUndefined();
    expect(managerFromUserAgent('')).toBeUndefined();
    expect(managerFromUserAgent('deno/2.0 node/? darwin arm64')).toBeUndefined();
  });

  // An agent names a command, and `yarn-classic` is an id no binary answers to; `toString` is on every object.
  it('answers nothing for an id that is not its own command, or a name every object inherits', () => {
    expect(managerFromUserAgent('yarn-classic/1.22.22 npm/? node/?')).toBeUndefined();
    expect(managerFromUserAgent('toString/1.0.0 npm/? node/?')).toBeUndefined();
  });

  // A manager that names itself without a version still names itself: the version is asked of the binary instead.
  it('answers the name alone where the token carries no version', () => {
    expect(managerFromUserAgent('pnpm/? npm/? node/?')).toEqual({
      name: 'pnpm',
      version: undefined,
    });
  });

  // A floor compares three numbers, so a version with anything before or after them is not read as one.
  it('reads no version from a token that is more than three numbers', () => {
    expect(managerFromUserAgent('pnpm/v12.5.1 npm/? node/?')?.version).toBeUndefined();
    expect(managerFromUserAgent('pnpm/12.5.1-rc.1 npm/? node/?')?.version).toBeUndefined();
  });

  // Classic is a readable major of exactly 1; a major merely ending in 1, or an unreadable 1.x, is Berry.
  it('takes only a readable yarn 1 for classic', () => {
    expect(managerFromUserAgent('yarn/21.0.0 npm/? node/?')?.name).toBe('yarn');
    expect(managerFromUserAgent('yarn/1.22.22-rc.1 npm/? node/?')?.name).toBe('yarn');
  });

  it('reads the version between the first slash and the next', () => {
    expect(managerFromUserAgent('pnpm/12.5.1/extra npm/? node/?')?.version).toBe('12.5.1');
  });
});

describe('acceptsManager', () => {
  it('accepts a version at the floor and refuses the one below it', () => {
    expect(acceptsManager('pnpm', '12.5.1')).toBe(true);
    expect(acceptsManager('pnpm', '10.26.0')).toBe(true);
    expect(acceptsManager('pnpm', '10.25.0')).toBe(false);
    expect(acceptsManager('npm', '9.6.5')).toBe(true);
    expect(acceptsManager('npm', '9.6.4')).toBe(false);
    expect(acceptsManager('yarn', '4.18.0')).toBe(true);
    expect(acceptsManager('yarn', '2.4.3')).toBe(false);
    expect(acceptsManager('bun', '1.2.0')).toBe(true);
    expect(acceptsManager('bun', '1.1.0')).toBe(false);
  });
});

describe('managerRefusal', () => {
  it('says nothing about a manager at or above its floor', () => {
    expect(managerRefusal('pnpm', '12.5.1')).toBeUndefined();
    expect(managerRefusal('yarn', '4.18.0')).toBeUndefined();
  });

  it('names both versions and the floor when the manager is too old', () => {
    expect(managerRefusal('npm', '9.6.4') ?? '').toBe(
      'npm 9.6.4 ran this, and a project this CLI writes needs npm 9.6.5 or newer. Upgrade it and run this again.',
    );
    expect(managerRefusal('bun', '1.1.0') ?? '').toContain('needs bun 1.2.0 or newer');
  });
});

describe('unversionedRefusal', () => {
  it('refuses a manager that named itself but answers no version', () => {
    expect(unversionedRefusal('pnpm')).toBe(
      'pnpm ran this, but `pnpm --version` answers nothing. Install it and run this again.',
    );
  });
});

describe('nodeRefusal', () => {
  it('says nothing on the floor this CLI runs on, or above it', () => {
    expect(nodeRefusal('22.13.0')).toBeUndefined();
    expect(nodeRefusal('26.9.0')).toBeUndefined();
  });

  it('names both versions and where to get one', () => {
    const refusal = nodeRefusal('22.12.0') ?? '';

    expect(refusal).toContain('Node 22.12.0 is running this');
    expect(refusal).toContain('needs Node 22.13.0 or newer');
    expect(refusal).toContain('https://nodejs.org');
  });

  /**
   * The case that separates this from the manager check above, which a major comparison would wave through: the
   * floor is the minor its own prompt library asks for, so 22.12 is refused and 22.13 is not.
   */
  it('compares the minor and the patch, not the major alone', () => {
    expect(nodeRefusal('22.0.0')).toBeDefined();
    expect(nodeRefusal('22.12.99')).toBeDefined();
  });
});

describe('the two yarns', () => {
  // Measured: `yarn create @linteljs` on 1.22.22 reaches this CLI with exactly this agent.
  it('reads yarn 1 as classic and everything later as berry', () => {
    expect(managerFromUserAgent('yarn/1.22.22 npm/? node/v26.9.0 darwin arm64')?.name).toBe('yarn-classic');
    expect(managerFromUserAgent('yarn/4.18.0 npm/? node/v26.9.0 darwin arm64')?.name).toBe('yarn');
    expect(managerFromUserAgent('yarn/2.4.3 npm/? node/? darwin arm64')?.name).toBe('yarn');
  });

  // An agent with no version to read is the one a `dlx` forwards to, which is a modern yarn.
  it('takes a yarn that will not say its version for berry', () => {
    expect(managerFromUserAgent('yarn/? npm/? node/?')?.name).toBe('yarn');
  });

  it('tells the lockfiles apart, and takes an unwritten one for berry', () => {
    expect(yarnFromLockfile('# THIS IS AN AUTOGENERATED FILE\n# yarn lockfile v1\n')).toBe('yarn-classic');
    expect(yarnFromLockfile('__metadata:\n  version: 8\n')).toBe('yarn');
    expect(yarnFromLockfile(null)).toBe('yarn');
  });

  it('holds each to its own floor, and names the command rather than the id', () => {
    expect(managerRefusal('yarn-classic', '1.22.22')).toBeUndefined();
    expect(managerRefusal('yarn-classic', '1.22.21') ?? '').toContain('yarn 1.22.21 ran this');
    expect(managerRefusal('yarn-classic', '1.22.21') ?? '').not.toContain('yarn-classic 1.22.21');
    expect(managerRefusal('yarn', '4.18.0')).toBeUndefined();
    expect(managerRefusal('yarn', '1.22.22') ?? '').toContain('needs yarn 4.0.0 or newer');
  });
});
