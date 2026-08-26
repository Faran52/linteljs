interface MarketplaceRef {
  source: {
    source: string;
    repo?: string;
    path?: string;
  };
}

// Type only keys this CLI owns; spreads preserve every project-owned setting.
export interface ClaudeSettings {
  // Explicitly `| undefined`, because the merge below reads it off a parsed file that may not carry it and
  // `exactOptionalPropertyTypes` separates a missing key from one set to undefined.
  includeCoAuthoredBy?: boolean | undefined;
  enabledPlugins?: Record<string, boolean>;
  extraKnownMarketplaces?: Record<string, MarketplaceRef>;
}

const isClaudeSettings = (value: unknown): value is ClaudeSettings => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Treat invalid project settings as absent so a sync is never blocked by an editable file.
const settingsIn = (text: string | null): ClaudeSettings => {
  if (text === null) {
    return {};
  }

  try {
    const value: unknown = JSON.parse(text);

    return isClaudeSettings(value) ? value : {};
  }
  catch {
    return {};
  }
};

// Merge owned keys while preserving project settings; replacing the file loses both.
export const mergeClaudeSettings = (emitted: string, current: string | null): string => {
  const ours = settingsIn(emitted);
  const theirs = settingsIn(current);

  const settings: ClaudeSettings = {
    // Ours first, so a project that has answered this question for itself keeps its answer and one that has not
    // takes the default. The two keys below are the other way round, because those are lists this CLI owns.
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
