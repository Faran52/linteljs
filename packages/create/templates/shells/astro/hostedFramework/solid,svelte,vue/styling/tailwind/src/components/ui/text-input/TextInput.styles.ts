interface ElementProps {
  readonly class: string;
}

export const styles = {
  field: { class: 'mb-4 flex flex-col gap-1.5' },
  label: { class: 'text-ui font-[560]' },
  error: { class: 'm-0 text-body text-destructive' },

  input: (invalid: boolean): ElementProps => {
    const props = { class: invalid ? 'w-full rounded-md border border-destructive bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring' : 'w-full rounded-md border border-input bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring' };

    return props;
  },

  textarea: (invalid: boolean): ElementProps => {
    const props = { class: invalid ? 'min-h-22 w-full resize-y rounded-md border border-destructive bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring' : 'min-h-22 w-full resize-y rounded-md border border-input bg-card px-2.5 py-2 text-ui text-foreground transition-colors focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring' };

    return props;
  },
};
