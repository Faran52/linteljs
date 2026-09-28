// crx reads its inputs from the manifest, which cannot name the devtools panel.
export const rollupInputs = (inputs: Record<string, string> | undefined): string => {
  if (inputs === undefined) {
    return '';
  }

  const entries = Object.entries(inputs)
    .map(([name, page]) => {
      return `${name}: '${page}'`;
    })
    .join(', ');

  return `  build: { rollupOptions: { input: { ${entries} } } },\n`;
};
