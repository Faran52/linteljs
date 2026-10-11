export const textInput = {
  field: 'mb-4 flex flex-col gap-1.5',
  label: 'text-ui font-[560]',
  error: 'm-0 text-body text-destructive',
  input: {
    when: 'invalid',
    on: 'w-full rounded-md border border-destructive bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
    off: 'w-full rounded-md border border-input bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
  },
  textarea: {
    when: 'invalid',
    on: 'min-h-22 w-full resize-y rounded-md border border-destructive bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
    off: 'min-h-22 w-full resize-y rounded-md border border-input bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
  },
};
