import { styles } from './HomePage.styles';

import type { Sx } from './ports';

export const sx = {
  hero: styles.hero,
  title: styles.title,
  lede: styles.lede,
  counter: styles.counter,
  count: styles.count,
  caption: styles.caption,
  hint: styles.hint,
} satisfies Sx;
