import './HomePage.css';

import type { Sx } from './ports';

export const sx = {
  hero: { className: 'hero' },
  title: { className: 'title' },
  lede: { className: 'lede' },
  counter: { className: 'counter' },
  count: { className: 'count' },
  caption: { className: 'caption' },
  hint: { className: 'hint' },
} satisfies Sx;
