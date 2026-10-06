import {
  type Answers,
  type Artifact,
  type Plugin,
} from '@config/types';

import { copied, emitted } from '../../utils/artifactUtils';
import { adapterArtifact } from '../utils/adapterUtils';

interface MarketplaceSource {
  source: 'git-subdir' | 'local' | 'url';
  path?: string;
  ref?: string;
  url?: string;
}

interface MarketplacePolicy {
  installation: 'INSTALLED_BY_DEFAULT';
  authentication: 'ON_INSTALL';
}

interface MarketplaceEntry {
  name: Plugin | 'linteljs';
  source: MarketplaceSource;
  policy: MarketplacePolicy;
  category: 'Design' | 'Developer Tools' | 'Productivity';
}

const LOCAL_LINTEL: MarketplaceEntry = {
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
};

const THIRD_PARTY: Record<Plugin, MarketplaceEntry> = {
  'ponytail': {
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
  'context7': {
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
  'frontend-design': {
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
};

export const emitCodexMarketplace = (plugins: Plugin[]): string => {
  const marketplace = {
    name: 'linteljs',
    interface: { displayName: 'LintelJS project plugins' },
    plugins: [LOCAL_LINTEL, ...plugins
      .map((plugin) => {
        return THIRD_PARTY[plugin];
      })],
  };

  return `${JSON.stringify(marketplace, null, 2)}\n`;
};

// Codex refuses a hooks file holding a key it does not know, and `modules` is Claude Code's. No hook entry has a
// `modules` key, so the reviver drops only the top-level one.
export const codexHooks = (source: string): string => {
  const hooks: unknown = JSON.parse(source, (key: string, value: unknown): unknown => {
    return key === 'modules' ? undefined : value;
  });

  return `${JSON.stringify(hooks, null, 2)}\n`;
};

export const codexMarketplaceEmitter = (answers: Answers): Artifact[] => {
  if (!answers.agents.includes('codex')) {
    return [];
  }

  const marketplace = emitCodexMarketplace(answers.plugins);
  const hooks: Artifact = {
    stage: 'standard',
    target: 'plugins/linteljs/hooks/codexHooks.json',
    content: {
      sources: ['project/plugins/linteljs/hooks/hooks.json'],
      transform: codexHooks,
    },
  };
  const artifacts = [
    adapterArtifact('AGENTS.md', answers),
    emitted('standard', '.agents/plugins/marketplace.json', marketplace),
    copied('plugins/linteljs/.codex-plugin/plugin.json'),
    hooks,
  ];

  return artifacts;
};
