import { styles } from './AppHeader.styles';

import type { Sx } from './ports';

export const sx = {
  header: styles.header,
  starterLabel: styles.starterLabel,
  brand: styles.brand,
  tabs: styles.tabs,
  inlineStyle: true,
  tab: (active: boolean) => styles.tab(active),
} satisfies Sx;
