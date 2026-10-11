interface ElementProps {
  readonly className: string;
}

export const styles = {
  status: { className: 'grid flex-1 place-content-center justify-items-center p-6 text-center' },
  statusCode: { className: 'm-0 text-[clamp(3.5rem,12vw,5.5rem)] leading-none font-bold tracking-[-0.03em] text-foreground' },
  statusMessage: { className: 'mx-0 mt-3.5 mb-0 text-[1.125rem] text-muted-foreground' },
  statusActions: { className: 'mt-6 flex flex-wrap justify-center gap-3' },

  action: (outlined: boolean): ElementProps => {
    const props = { className: outlined ? 'inline-flex h-9.5 items-center rounded-md border border-border bg-transparent px-3.75 py-0 text-ui font-label text-foreground no-underline' : 'inline-flex h-9.5 items-center rounded-md border border-transparent bg-primary px-3.75 py-0 text-ui font-label text-primary-foreground no-underline' };

    return props;
  },
};
