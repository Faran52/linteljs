export const CONTEXT_WARN_TOKENS = 130_000;

export const CONTEXT_CEILING_TOKENS = 150_000;

// The badge and the warning count in thousands: `130K`.
export const TOKENS_PER_K = 1000;

// The last assistant entry sits near the end; one huge tool result past it still fits.
export const TRANSCRIPT_TAIL_BYTES = 4_000_000;

// 256-colour codes: green, amber, red.
export const BADGE_COLOURS = {
  under: 108,
  near: 173,
  over: 167,
} as const;
