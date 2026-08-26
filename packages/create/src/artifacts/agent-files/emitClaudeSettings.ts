import type { Plugin } from '../../model/answers/answers';

export const emitClaudeSettings = (plugins: Plugin[]): string => {
  const usesOfficialMarketplace = plugins.includes('context7')
    || plugins.includes('frontend-design');
  const settings = {
    /**
     * The harness setting, not just the rule. `CLAUDE.md` and `AGENTS.md` both state that a commit message carries no
     * trailer, and a rule with nothing behind it is what lets one arrive anyway: every current coding agent appends
     * `Co-Authored-By` by default, and the same generated rules ban rewriting a commit, which is the only in-repo way
     * to take one back off. `mergeClaudeSettings` keeps whatever a project sets here, so this is a default rather than
     * a decision imposed on it.
     */
    includeCoAuthoredBy: false,
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
