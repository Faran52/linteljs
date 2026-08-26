import type { Plugin } from '../../model/answers/answers';

export const emitClaudeSettings = (plugins: Plugin[]): string => {
  const usesOfficialMarketplace = plugins.includes('context7')
    || plugins.includes('frontend-design');
  const settings = {
    enabledPlugins: {
      'linteljs@linteljs': true,
      ...(plugins.includes('ponytail') ? { 'ponytail@ponytail': true } : {}),
      ...(plugins.includes('context7')
        ? { 'context7@claude-plugins-official': true }
        : {}),
      ...(plugins.includes('frontend-design')
        ? { 'frontend-design@claude-plugins-official': true }
        : {}),
    },
    extraKnownMarketplaces: {
      linteljs: {
        source: {
          source: 'directory',
          path: './plugins/linteljs',
        },
      },
      ...(plugins.includes('ponytail')
        ? {
            ponytail: {
              source: {
                source: 'github',
                repo: 'DietrichGebert/ponytail',
              },
            },
          }
        : {}),
      ...(usesOfficialMarketplace
        ? {
            'claude-plugins-official': {
              source: {
                source: 'github',
                repo: 'anthropics/claude-plugins-official',
              },
            },
          }
        : {}),
    },
  };

  return `${JSON.stringify(settings, null, 2)}\n`;
};
