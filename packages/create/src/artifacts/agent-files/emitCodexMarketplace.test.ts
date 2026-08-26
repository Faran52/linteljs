import {
  describe,
  expect,
  it,
} from 'vitest';

import { emitCodexMarketplace } from './emitCodexMarketplace';

describe('emitCodexMarketplace', () => {
  it('declares LintelJS first and all selected plugins with exact policies', () => {
    const marketplace: unknown = JSON.parse(emitCodexMarketplace([
      'ponytail',
      'context7',
      'frontend-design',
    ]));

    expect(marketplace).toEqual({
      name: 'linteljs',
      interface: { displayName: 'LintelJS project plugins' },
      plugins: [
        {
          name: 'linteljs',
          source: {
            source: 'local',
            path: './plugins/linteljs',
          },
          policy: {
            installation: 'INSTALLED_BY_DEFAULT',
            authentication: 'ON_INSTALL',
          },
          category: 'Developer Tools',
        },
        {
          name: 'ponytail',
          source: {
            source: 'url',
            url: 'https://github.com/DietrichGebert/ponytail.git',
            ref: 'main',
          },
          policy: {
            installation: 'INSTALLED_BY_DEFAULT',
            authentication: 'ON_INSTALL',
          },
          category: 'Productivity',
        },
        {
          name: 'context7',
          source: {
            source: 'git-subdir',
            url: 'https://github.com/anthropics/claude-plugins-official.git',
            path: 'external_plugins/context7',
            ref: 'main',
          },
          policy: {
            installation: 'INSTALLED_BY_DEFAULT',
            authentication: 'ON_INSTALL',
          },
          category: 'Developer Tools',
        },
        {
          name: 'frontend-design',
          source: {
            source: 'git-subdir',
            url: 'https://github.com/anthropics/claude-plugins-official.git',
            path: 'plugins/frontend-design',
            ref: 'main',
          },
          policy: {
            installation: 'INSTALLED_BY_DEFAULT',
            authentication: 'ON_INSTALL',
          },
          category: 'Design',
        },
      ],
    });
  });

  it('retains only the local LintelJS declaration with no selected plugins', () => {
    const output = emitCodexMarketplace([]);
    const marketplace: unknown = JSON.parse(output);

    expect(marketplace).toEqual({
      name: 'linteljs',
      interface: { displayName: 'LintelJS project plugins' },
      plugins: [
        {
          name: 'linteljs',
          source: {
            source: 'local',
            path: './plugins/linteljs',
          },
          policy: {
            installation: 'INSTALLED_BY_DEFAULT',
            authentication: 'ON_INSTALL',
          },
          category: 'Developer Tools',
        },
      ],
    });
    expect(output.endsWith('\n')).toBe(true);
  });

  it('preserves the selected plugin declaration order', () => {
    const marketplace: unknown = JSON.parse(emitCodexMarketplace([
      'frontend-design',
      'ponytail',
    ]));

    expect(marketplace).toMatchObject({
      plugins: [
        { name: 'linteljs' },
        { name: 'frontend-design' },
        { name: 'ponytail' },
      ],
    });
  });
});
