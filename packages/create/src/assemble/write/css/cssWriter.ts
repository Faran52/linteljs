// The `css` share lists what the CSS entry imports, in drawer order.
export const cssWriter = (imports: readonly string[]): string => {
  return imports
    .map((path) => {
      return `@import '${path}';\n`;
    })
    .join('');
};
