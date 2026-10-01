import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import { codexMarketplaceEmitter, emitCodexMarketplace } from './codexMarketplaceEmitter';

import type { Answers } from '@config/types';

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

describe('codexMarketplaceEmitter', () => {
  const CODEX: Answers = {
    ...DEFAULT_ANSWERS,
    agents: ['codex'],
    plugins: ['frontend-design', 'ponytail'],
  };

  it('writes nothing unless Codex was chosen', () => {
    expect(codexMarketplaceEmitter(DEFAULT_ANSWERS)).toEqual([]);
  });

  it('writes the adapter, the marketplace of the chosen plugins and the plugin manifest', () => {
    const artifacts = codexMarketplaceEmitter(CODEX);

    const shapes = artifacts
      .map(({
        stage,
        target,
        preserve,
      }) => {
        return [
          stage,
          target,
          preserve,
        ];
      });

    expect(shapes).toEqual([
      [
        'standard',
        'AGENTS.md',
        true,
      ],
      [
        'standard',
        '.agents/plugins/marketplace.json',
        undefined,
      ],
      [
        'standard',
        'plugins/linteljs/.codex-plugin/plugin.json',
        undefined,
      ],
    ]);

    expect(artifacts[1]?.content).toEqual({ text: emitCodexMarketplace(CODEX.plugins) });
  });

  it('ships the exact minimal local plugin metadata', async () => {
    const [
      ,
      ,
      plugin,
    ] = codexMarketplaceEmitter(CODEX);
    const longDescription = "Applies the generated project's LintelJS structure, typing, testing, "
      + 'and verification standards.';

    expect(plugin === undefined ? '' : await shippedAssetsReader(plugin.content)).toBe(`{
  "name": "linteljs",
  "version": "1.0.0",
  "description": "LintelJS project standards and safety hooks",
  "author": { "name": "Faran Ali" },
  "skills": "./skills/",
  "interface": {
    "displayName": "LintelJS",
    "shortDescription": "Project structure, type-safety, and verification rules",
    "longDescription": "${longDescription}",
    "developerName": "Faran Ali",
    "category": "Developer Tools",
    "capabilities": ["Instructions", "Lifecycle hooks"],
    "defaultPrompt": ["Apply this project's LintelJS standards to my task."]
  }
}
`);
  });
});
