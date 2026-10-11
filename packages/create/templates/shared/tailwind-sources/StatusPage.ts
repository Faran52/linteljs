export const statusPage = {
  status: 'grid flex-1 place-content-center justify-items-center p-6 text-center',
  statusCode: 'm-0 text-[length:clamp(3.5rem,12vw,5.5rem)] leading-none font-bold tracking-[-0.03em] text-foreground',
  statusMessage: 'mx-0 mt-3.5 mb-0 text-[1.125rem] text-muted-foreground',
  statusActions: 'mt-6 flex flex-wrap justify-center gap-3',
  action: {
    when: 'outlined',
    on: 'inline-flex h-[38px] items-center rounded-md border border-border bg-transparent px-3.75 py-0 text-ui font-[540] text-foreground no-underline',
    off: 'inline-flex h-[38px] items-center rounded-md border border-transparent bg-primary px-3.75 py-0 text-ui font-[540] text-primary-foreground no-underline',
  },
};
