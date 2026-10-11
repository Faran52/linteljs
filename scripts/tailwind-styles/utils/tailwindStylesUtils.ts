import type { Table, Toggle } from '../../utils/codegenUtils.ts';

export interface StylesFile {
  readonly table: Table;
  readonly path: string;
  // The keys a variant of the component renders; every key when absent.
  readonly keys?: readonly string[];
}

export interface Target {
  readonly root: string;
  readonly attribute: string;
  readonly files: readonly StylesFile[];
}

const toggleText = (key: string, toggle: Toggle, attribute: string): string => {
  return `  ${key}: (${toggle.when}: boolean): ElementProps => {
    const props = { ${attribute}: ${toggle.when} ? '${toggle.on}' : '${toggle.off}' };

    return props;
  },`;
};

export const stylesText = (file: StylesFile, attribute: string): string => {
  const entries = Object.entries(file.table)
    .filter(([key]) => {
      return file.keys === undefined || file.keys.includes(key);
    });
  const plain: string[] = [];
  const toggles: string[] = [];

  for (const [key, value] of entries) {
    if (typeof value === 'string') {
      plain.push(`  ${key}: { ${attribute}: '${value}' },`);
    }
    else {
      toggles.push(toggleText(key, value, attribute));
    }
  }

  if (toggles.length === 0) {
    return `export const styles = {\n${plain.join('\n')}\n};\n`;
  }

  const header = `interface ElementProps {\n  readonly ${attribute}: string;\n}\n\n`;
  const body = [plain.join('\n'), ...toggles].join('\n\n');

  return `${header}export const styles = {\n${body}\n};\n`;
};
