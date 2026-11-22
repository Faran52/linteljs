// The defaults of the plugin's `context_warn_tokens` and `context_ceiling_tokens` options, which the badges colour by.
export const DEFAULT_CONTEXT_WARN_TOKENS = 130_000;

export const DEFAULT_CONTEXT_CEILING_TOKENS = 150_000;

// The badge and the warning count in thousands: `130K`.
export const TOKENS_PER_K = 1000;

// The last assistant entry sits near the end; one huge tool result past it still fits.
export const TRANSCRIPT_TAIL_BYTES = 4_000_000;

// The first entry's timestamp sits near the start; a long brief still fits.
export const TRANSCRIPT_HEAD_BYTES = 64_000;

export const MS_PER_MINUTE = 60_000;

export const MINUTES_PER_HOUR = 60;

// 256-colour codes: green, amber, red.
export const BADGE_COLOURS = {
  under: 108,
  near: 173,
  over: 167,
} as const;

// 256-colour code for the model badge: steel blue, apart from the context colours.
export const MODEL_BADGE_COLOUR = 110;
