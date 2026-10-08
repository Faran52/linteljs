import {
  AUTO_IMPORTED,
  BLANK_AFTER_SCRIPT_TAG,
  COMPONENT_IMPORT,
  EXTRA_BLANK_LINES,
  MULTILINE_SPECIFIERS,
  NAMED_IMPORT,
  REGISTERED_COMPONENT,
} from '../constants';

const importOf = (names: string[], from: string): string => {
  if (names.length === 0) {
    return '';
  }

  const list = names.length < MULTILINE_SPECIFIERS ? ` ${names.join(', ')} ` : `\n  ${names.join(',\n  ')},\n`;

  return `import {${list}} from '${from}';\n`;
};

const withoutAutoImported = (whole: string, names: string, from: string): string => {
  const dropped = AUTO_IMPORTED[from];

  if (dropped === undefined) {
    return whole;
  }

  const kept = names
    .split(',')
    .map((name) => {
      return name.trim();
    })
    .filter((name) => {
      return name !== '' && !dropped.includes(name);
    });

  return importOf(kept, from);
};

// A file under `src/components/` reaches a sibling relatively; anywhere else a relative `.vue` is not registered.
export const inNuxtDialect = (target: string) => {
  const inComponents = target.startsWith('src/components/');

  return (source: string): string => {
    return source
      .replaceAll(NAMED_IMPORT, (whole, names: string, from: string) => {
        return withoutAutoImported(whole, names, from);
      })
      .replaceAll(COMPONENT_IMPORT, (whole, from: string) => {
        const registered = REGISTERED_COMPONENT.test(from) && (inComponents || from.startsWith('@'));

        return registered ? '' : whole;
      })
      .replaceAll(EXTRA_BLANK_LINES, '\n\n')
      .replaceAll(BLANK_AFTER_SCRIPT_TAG, '$<tag>')
      .trimStart();
  };
};
