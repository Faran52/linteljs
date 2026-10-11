// A styles entry is the attributes it sets: `class` in every styling, and StyleX's `style` where it emits one.
export type ElementStyles = Readonly<{ class?: string | undefined; style?: string | undefined }>;

export const applyStyles = (element: Element, styles: ElementStyles): void => {
  for (const [name, value] of Object.entries(styles)) {
    if (value !== undefined) {
      element.setAttribute(name, value);
    }
  }
};

export const attributesOf = (styles: ElementStyles): string => {
  return Object.entries(styles)
    .flatMap(([name, value]) => {
      if (value === undefined) {
        return [];
      }

      const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

      return [`${name}="${escaped}"`];
    })
    .join(' ');
};
