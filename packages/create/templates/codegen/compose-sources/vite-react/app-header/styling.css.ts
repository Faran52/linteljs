import './AppHeader.css';

import type { Sx } from './ports';

export const sx = {
  header: { className: 'header' },
  starterLabel: { className: 'starter-label' },
  brand: { className: 'brand' },
  tabs: { className: 'tabs' },
  inlineStyle: false,
  tab: (active: boolean) => ({ className: active ? 'tab tab-button tab-current' : 'tab tab-button' }),
} satisfies Sx;
