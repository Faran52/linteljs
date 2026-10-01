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
} from './hostUtils';

describe('managerFromUserAgent', () => {
  it('reads the name and version off the first token', () => {
    expect(managerFromUserAgent('pnpm/12.5.1 npm/? node/? darwin arm64')).toEqual({
      name: 'pnpm',
      version: '12.5.1',
    });
    expect(managerFromUserAgent('npm/11.19.1 node/v26.9.0 darwin arm64 workspaces/false')).toEqual({
      name: 'npm',
      version: '11.19.1',
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

  it('answers nothing for an id that is not its own command, or a name every object inherits', () => {
    expect(managerFromUserAgent('yarn-classic/1.22.22 npm/? node/?')).toBeUndefined();
    expect(managerFromUserAgent('toString/1.0.0 npm/? node/?')).toBeUndefined();
  });

  it('answers the name alone where the token carries no version', () => {
    expect(managerFromUserAgent('pnpm/? npm/? node/?')).toEqual({
      name: 'pnpm',
      version: undefined,
    });
  });

  it('reads no version from a token that is more than three numbers', () => {
    expect(managerFromUserAgent('pnpm/v12.5.1 npm/? node/?')?.version).toBeUndefined();
    expect(managerFromUserAgent('pnpm/12.5.1-rc.1 npm/? node/?')?.version).toBeUndefined();
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

  it('compares the minor and the patch, not the major alone', () => {
    expect(nodeRefusal('22.0.0')).toBeDefined();
    expect(nodeRefusal('22.12.99')).toBeDefined();
  });
});

describe('yarn', () => {
  it('reads every major as yarn and keeps the version for the refusal', () => {
    expect(managerFromUserAgent('yarn/1.22.22 npm/? node/v26.9.0 darwin arm64')).toEqual({
      name: 'yarn',
      version: '1.22.22',
    });
    expect(managerFromUserAgent('yarn/4.18.0 npm/? node/v26.9.0 darwin arm64')?.name).toBe('yarn');
    expect(managerFromUserAgent('yarn/? npm/? node/?')?.name).toBe('yarn');
  });

  it('refuses yarn 1 by name, and holds yarn to its floor', () => {
    expect(managerRefusal('yarn', '1.22.22')).toBe('Yarn 1 is not supported: install Yarn 4 and run this again.');
    expect(managerRefusal('yarn', '2.4.3') ?? '').toContain('needs yarn 4.0.0 or newer');
    expect(managerRefusal('yarn', '4.18.0')).toBeUndefined();
  });
});
