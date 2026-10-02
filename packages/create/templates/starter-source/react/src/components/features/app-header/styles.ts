import type { CSSProperties } from 'react';

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
    const props = { className: current ? 'tab tab-button tab-current' : 'tab tab-button' };

    return props;
  },
};
