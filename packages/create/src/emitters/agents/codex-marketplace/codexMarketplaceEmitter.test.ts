import {
  describe,
  expect,
  it,
} from 'vitest';

import { isJsonObject, parsedAs } from '@utils/objectUtils';

import { DEFAULT_ANSWERS } from '@answers';
import { shippedAssetsReader } from '@disk';

import {
  codexHooks,
  codexMarketplaceEmitter,
  emitCodexMarketplace,
} from './codexMarketplaceEmitter';

import type { Answers } from '@config/types';

describe('emitCodexMarketplace', () => {
  it('declares LintelJS first and all selected plugins with exact policies', () => {
    const marketplace: unknown = JSON.parse(emitCodexMarketplace([
      'ponytail',
      'context7',
      'frontend-design',
    ]));

    const expected = {
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
    };
    expect(marketplace).toEqual(expected);
  });

  it('retains only the local LintelJS declaration with no selected plugins', () => {
    const output = emitCodexMarketplace([]);
    const marketplace: unknown = JSON.parse(output);

    const expected = {
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
    };
    expect(marketplace).toEqual(expected);

    const actual = output.endsWith('\n');
    expect(actual).toBe(true);
  });

  it('preserves the selected plugin declaration order', () => {
    const marketplace: unknown = JSON.parse(emitCodexMarketplace([
      'frontend-design',
      'ponytail',
    ]));

    const expected = {
      plugins: [
        { name: 'linteljs' },
        { name: 'frontend-design' },
        { name: 'ponytail' },
      ],
    };
    expect(marketplace).toMatchObject(expected);
  });
});

describe('codexMarketplaceEmitter', () => {
  const CODEX: Answers = {
    ...DEFAULT_ANSWERS,
    agents: ['codex'],
    plugins: ['frontend-design', 'ponytail'],
  };

  it('writes nothing unless Codex was chosen', () => {
    const codexMarketplace = codexMarketplaceEmitter(DEFAULT_ANSWERS);
    expect(codexMarketplace).toEqual([]);
  });

  it('writes the marketplace of the chosen plugins and the plugin manifest', () => {
    const artifacts = codexMarketplaceEmitter(CODEX);

    const shapes = artifacts
      .map(({
        stage,
        target,
        preserve,
      }) => {
        const shape = [
          stage,
          target,
          preserve,
        ];
        return shape;
      });

    const expected = [
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
      [
        'standard',
        'plugins/linteljs/hooks/codexHooks.json',
        undefined,
      ],
    ];
    expect(shapes).toEqual(expected);

    const expectedContent = { text: emitCodexMarketplace(CODEX.plugins) };
    expect(artifacts[0]?.content).toEqual(expectedContent);
  });

  it('ships the exact minimal local plugin metadata', async () => {
    const [, plugin] = codexMarketplaceEmitter(CODEX);
    const longDescription = "Applies the generated project's LintelJS structure, typing, testing, "
      + 'and verification standards.';

    const pluginText = plugin === undefined ? '' : await shippedAssetsReader(plugin.content);

    expect(pluginText).toBe(`{
  "name": "linteljs",
  "version": "1.0.0",
  "description": "LintelJS project standards and safety hooks",
  "author": { "name": "Faran Ali" },
  "skills": "./skills/",
  "hooks": "./hooks/codexHooks.json",
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

  it('ships Claude Code\'s hooks to Codex without the modules key Codex refuses', async () => {
    const [
      ,
      ,
      hooksFile,
    ] = codexMarketplaceEmitter(CODEX);

    const hooksText = hooksFile === undefined ? '' : await shippedAssetsReader(hooksFile.content);
    const claudeText = await shippedAssetsReader({ sources: ['project/plugins/linteljs/hooks/hooks.json'] });
    const claudeHooks = parsedAs(claudeText, isJsonObject);
    const codexFile = parsedAs(hooksText, isJsonObject) ?? {};
    const codexKeys = Object.keys(codexFile);
    const isTerminated = hooksText.endsWith('}\n');

    expect(claudeHooks).toHaveProperty('modules');
    expect(claudeHooks).toMatchObject(codexFile);
    expect(codexKeys).toEqual(['hooks']);
    expect(isTerminated).toBe(true);
  });

  it('drops the modules key and keeps every other one', () => {
    const source = '{"modules":["./a.tsx"],"hooks":{"Stop":[]},"description":"d"}';

    const written = codexHooks(source);

    expect(written).toBe('{\n  "hooks": {\n    "Stop": []\n  },\n  "description": "d"\n}\n');
  });
});
