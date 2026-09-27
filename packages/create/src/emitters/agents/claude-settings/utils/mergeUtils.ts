import { isJsonObject, parsedAs } from '@utils/objectUtils';

interface MarketplaceLocation {
  source: string;
  repo?: string;
  path?: string;
}

interface MarketplaceRef {
  source: MarketplaceLocation;
}

// Only the keys this CLI owns are typed; spreads keep every project-owned setting.
interface ClaudeSettings {
  // Explicitly `| undefined`: `exactOptionalPropertyTypes` separates a missing key from one set to undefined.
  includeCoAuthoredBy?: boolean | undefined;
  enabledPlugins?: Record<string, boolean>;
  extraKnownMarketplaces?: Record<string, MarketplaceRef>;
}

const isClaudeSettings = (value: unknown): value is ClaudeSettings => {
  return isJsonObject(value);
};

// Invalid project settings read as absent, so a sync is never blocked by an editable file. No file reads as JSON
// `null`, which is no settings either.
const settingsIn = (text: string | null): ClaudeSettings => {
  return parsedAs(text, isClaudeSettings) ?? {};
};

export const mergeClaudeSettings = (emitted: string, current: string | null): string => {
  const ours = settingsIn(emitted);
  const theirs = settingsIn(current);

  const settings: ClaudeSettings = {
    // Ours first, so a project's own answer wins; the two lists below are the other way round, being this CLI's.
    includeCoAuthoredBy: ours.includeCoAuthoredBy,
    ...theirs,
    enabledPlugins: {
      ...theirs.enabledPlugins,
      ...ours.enabledPlugins,
    },
    extraKnownMarketplaces: {
      ...theirs.extraKnownMarketplaces,
      ...ours.extraKnownMarketplaces,
    },
  };

  return `${JSON.stringify(settings, null, 2)}\n`;
};
