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
      name: 'yarn',
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

  // A manager that names itself without a version still names itself: the version is asked of the binary instead.
  it('answers the name alone where the token carries no version', () => {
    expect(managerFromUserAgent('pnpm/? npm/? node/?')).toEqual({
      name: 'pnpm',
      version: undefined,
    });
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

  // Yarn 1 gets a different instruction, not a stronger one: `dlx` there forwards to a modern yarn on its own.
  it('points yarn 1 at dlx rather than at an upgrade', () => {
    const refusal = managerRefusal('yarn', '1.22.22') ?? '';

    expect(refusal).toContain('yarn dlx @linteljs/create <name>');
    expect(refusal).toContain('yarn set version stable');
    expect(managerRefusal('yarn', '2.4.3') ?? '').not.toContain('yarn dlx');
  });

  it('refuses a manager that named itself but answers no version', () => {
    expect(managerRefusal('pnpm', undefined) ?? '').toBe(
      'pnpm ran this, but `pnpm --version` answers nothing. Install it and run this again.',
    );
  });
});

describe('nodeRefusal', () => {
  it('says nothing on the floor this CLI runs on, or above it', () => {
    expect(nodeRefusal('22.6.0')).toBeUndefined();
    expect(nodeRefusal('26.9.0')).toBeUndefined();
  });

  it('names both versions and where to get one', () => {
    const refusal = nodeRefusal('22.5.0') ?? '';

    expect(refusal).toContain('Node 22.5.0 is running this');
    expect(refusal).toContain('needs Node 22.6.0 or newer');
    expect(refusal).toContain('https://nodejs.org');
  });

  /**
   * The case that separates this from the manager check above, which a major comparison would wave through: the
   * floor is the release where `--experimental-strip-types` first exists, so 22.5 is refused and 22.6 is not.
   */
  it('compares the minor and the patch, not the major alone', () => {
    expect(nodeRefusal('22.0.0')).toBeDefined();
    expect(nodeRefusal('22.5.99')).toBeDefined();
  });
});
