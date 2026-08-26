import type { Plugin } from '../../model/answers/answers';

interface MarketplaceEntry {
  name: Plugin | 'linteljs';
  source: {
    source: 'git-subdir' | 'local' | 'url';
    path?: string;
    ref?: string;
    url?: string;
  };
  policy: {
    installation: 'INSTALLED_BY_DEFAULT';
    authentication: 'ON_INSTALL';
  };
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
    plugins: [LOCAL_LINTEL, ...plugins.map((plugin) => {
      return THIRD_PARTY[plugin];
    })],
  };

  return `${JSON.stringify(marketplace, null, 2)}\n`;
};
