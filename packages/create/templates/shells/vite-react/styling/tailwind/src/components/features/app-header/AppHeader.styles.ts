import type { CSSProperties } from 'react';

interface ElementProps {
  readonly className: string;
  readonly style?: CSSProperties;
}

export const styles = {
  header: { className: 'flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4.5 py-3' },
  starterLabel: { className: 'm-0 flex-none text-eyebrow font-title tracking-eyebrow whitespace-nowrap text-primary uppercase max-[30rem]:hidden' },
  brand: { className: 'm-0 min-w-0 flex-auto text-ui font-semibold tracking-[-0.01em] wrap-anywhere' },
  tabs: { className: 'flex flex-none gap-0.5' },

  tab: (current: boolean): ElementProps => {
    const props = { className: current ? 'inline-flex min-h-11 cursor-pointer items-center rounded-md border-0 bg-transparent px-2.5 py-1.25 text-ui font-[560] text-primary no-underline transition-colors hover:bg-muted hover:text-foreground' : 'inline-flex min-h-11 cursor-pointer items-center rounded-md border-0 bg-transparent px-2.5 py-1.25 text-ui text-muted-foreground no-underline transition-colors hover:bg-muted hover:text-foreground' };

    return props;
  },
};
