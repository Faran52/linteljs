import type { LibraryLayer } from '@config/types';

// The libraries and routers with a layer behind them, in emit order so the written config is stable; the rest bring
// no ESLint rules.
export const LIBRARY_LAYERS: readonly LibraryLayer[] = ['tanstack-query', 'tanstack-router', 'tailwind'];
