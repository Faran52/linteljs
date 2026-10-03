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
    const pnpmManager = managerFromUserAgent('pnpm/12.5.1 npm/? node/? darwin arm64');
    const expectedPnpm = {
      name: 'pnpm',
      version: '12.5.1',
    };
    expect(pnpmManager).toEqual(expectedPnpm);

    const npmManager = managerFromUserAgent('npm/11.19.1 node/v26.9.0 darwin arm64 workspaces/false');
    const expectedNpm = {
      name: 'npm',
      version: '11.19.1',
    };
    expect(npmManager).toEqual(expectedNpm);

    const yarnManager = managerFromUserAgent('yarn/4.18.0 npm/? node/v26.9.0 darwin arm64');
    const expectedYarn = {
      name: 'yarn',
      version: '4.18.0',
    };
    expect(yarnManager).toEqual(expectedYarn);

    const bunManager = managerFromUserAgent('bun/1.3.14 npm/? node/v24.3.0 darwin arm64');
    const expectedBun = {
      name: 'bun',
      version: '1.3.14',
    };
    expect(bunManager).toEqual(expectedBun);
  });

  it('answers nothing for an unset agent or a runtime that is not one of the four', () => {
    const unsetAgentManager = managerFromUserAgent(undefined);
    expect(unsetAgentManager).toBeUndefined();
    const emptyAgentManager = managerFromUserAgent('');
    expect(emptyAgentManager).toBeUndefined();
    const denoManager = managerFromUserAgent('deno/2.0 node/? darwin arm64');
    expect(denoManager).toBeUndefined();
  });

  it('answers nothing for an id that is not its own command, or a name every object inherits', () => {
    const yarnClassicManager = managerFromUserAgent('yarn-classic/1.22.22 npm/? node/?');
    expect(yarnClassicManager).toBeUndefined();
    const inheritedNameManager = managerFromUserAgent('toString/1.0.0 npm/? node/?');
    expect(inheritedNameManager).toBeUndefined();
  });

  it('answers the name alone where the token carries no version', () => {
    const actual = managerFromUserAgent('pnpm/? npm/? node/?');
    const expected = {
      name: 'pnpm',
      version: undefined,
    };
    expect(actual).toEqual(expected);
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
    const acceptsCurrentPnpm = acceptsManager('pnpm', '12.5.1');
    expect(acceptsCurrentPnpm).toBe(true);
    const acceptsPnpmFloor = acceptsManager('pnpm', '10.26.0');
    expect(acceptsPnpmFloor).toBe(true);
    const acceptsPnpmBelowFloor = acceptsManager('pnpm', '10.25.0');
    expect(acceptsPnpmBelowFloor).toBe(false);
    const acceptsNpmFloor = acceptsManager('npm', '9.6.5');
    expect(acceptsNpmFloor).toBe(true);
    const acceptsNpmBelowFloor = acceptsManager('npm', '9.6.4');
    expect(acceptsNpmBelowFloor).toBe(false);
    const acceptsCurrentYarn = acceptsManager('yarn', '4.18.0');
    expect(acceptsCurrentYarn).toBe(true);
    const acceptsYarnBelowFloor = acceptsManager('yarn', '2.4.3');
    expect(acceptsYarnBelowFloor).toBe(false);
    const acceptsBunFloor = acceptsManager('bun', '1.2.0');
    expect(acceptsBunFloor).toBe(true);
    const acceptsBunBelowFloor = acceptsManager('bun', '1.1.0');
    expect(acceptsBunBelowFloor).toBe(false);
  });
});

describe('managerRefusal', () => {
  it('says nothing about a manager at or above its floor', () => {
    const pnpmRefusal = managerRefusal('pnpm', '12.5.1');
    expect(pnpmRefusal).toBeUndefined();
    const yarnRefusal = managerRefusal('yarn', '4.18.0');
    expect(yarnRefusal).toBeUndefined();
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
    const actual = unversionedRefusal('pnpm');

    expect(actual).toBe(
      'pnpm ran this, but `pnpm --version` answers nothing. Install it and run this again.',
    );
  });
});

describe('nodeRefusal', () => {
  it('says nothing on the floor this CLI runs on, or above it', () => {
    const floorRefusal = nodeRefusal('22.18.0');
    expect(floorRefusal).toBeUndefined();
    const currentRefusal = nodeRefusal('26.9.0');
    expect(currentRefusal).toBeUndefined();
  });

  it('names both versions and where to get one', () => {
    const refusal = nodeRefusal('22.17.0') ?? '';

    expect(refusal).toContain('Node 22.17.0 is running this');
    expect(refusal).toContain('needs Node 22.18.0 or newer');
    expect(refusal).toContain('https://nodejs.org');
  });

  it('compares the minor and the patch, not the major alone', () => {
    const majorOnlyRefusal = nodeRefusal('22.0.0');
    expect(majorOnlyRefusal).toBeDefined();
    const belowPatchRefusal = nodeRefusal('22.12.99');
    expect(belowPatchRefusal).toBeDefined();
  });
});

describe('yarn', () => {
  it('reads every major as yarn and keeps the version for the refusal', () => {
    const actual = managerFromUserAgent('yarn/1.22.22 npm/? node/v26.9.0 darwin arm64');
    const expected = {
      name: 'yarn',
      version: '1.22.22',
    };
    expect(actual).toEqual(expected);

    expect(managerFromUserAgent('yarn/4.18.0 npm/? node/v26.9.0 darwin arm64')?.name).toBe('yarn');
    expect(managerFromUserAgent('yarn/? npm/? node/?')?.name).toBe('yarn');
  });

  it('refuses yarn 1 by name, and holds yarn to its floor', () => {
    const yarnOneRefusal = managerRefusal('yarn', '1.22.22');
    expect(yarnOneRefusal).toBe('Yarn 1 is not supported: install Yarn 4 and run this again.');
    expect(managerRefusal('yarn', '2.4.3') ?? '').toContain('needs yarn 4.0.0 or newer');
    const currentYarnRefusal = managerRefusal('yarn', '4.18.0');
    expect(currentYarnRefusal).toBeUndefined();
  });
});
