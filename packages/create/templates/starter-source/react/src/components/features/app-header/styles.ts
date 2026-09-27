// Props, so `AppHeader.tsx` varies by router alone and not by the styling answer too.
import type { CSSProperties } from 'react';

// The shape StyleX's `props` answers; plain CSS never sets `style`.
interface ElementProps {
  readonly className: string;
  readonly style?: CSSProperties;
}

export const styles = {
  header: { className: 'header' },
  starterLabel: { className: 'starter-label' },
  brand: { className: 'brand' },
  tabs: { className: 'tabs' },

  tab: (current: boolean): ElementProps => {
    return { className: current ? 'tab tab-button tab-current' : 'tab tab-button' };
  },
};
