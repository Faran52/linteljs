import {
  type Answers,
  type Artifact,
  type ComposeConfigOptions,
  type LibraryLayer,
} from '@config/types';

import { targetFor } from '@targets';

import { buildAliases } from '../../utils/aliasUtils';
import { emitted } from '../../utils/artifactUtils';

import {
  BASE_IGNORES,
  LIBRARY_LAYERS,
  MAX_LINE,
  PACKAGE,
} from './constants';

// A renamed option fails to compile here rather than in a project.
type OptionRow = [keyof ComposeConfigOptions, string];

const LAYER_ANSWERS: Record<LibraryLayer, (answers: Answers) => boolean> = {
  'tanstack-query': (answers) => {
    return answers.data === 'tanstack-query';
  },
  'tanstack-router': (answers) => {
    return answers.router === 'tanstack-router';
  },
  'tailwind': (answers) => {
    return answers.styling === 'tailwind';
  },
  'stylex': (answers) => {
    return answers.styling === 'stylex';
  },
};

// `String.raw`, or a backslash parses back as an escape.
const quote = (value: string): string => {
  if (value.includes('\\')) {
    return `String.raw\`${value}\``;
  }

  return `'${value.replaceAll("'", "\\'")}'`;
};

const indentOf = (level: number): string => {
  return '  '.repeat(level);
};

const arrayLiteral = (key: string, values: string[], level = 1): string => {
  const inline = `[${values
    .map(quote)
    .join(', ')}]`;

  if (`${indentOf(level)}${key}: ${inline},`.length <= MAX_LINE) {
    return inline;
  }

  const entries = values
    .map((value) => {
      return `${indentOf(level + 1)}${quote(value)},`;
    });

  return `[\n${entries.join('\n')}\n${indentOf(level)}]`;
};

const arrayRow = (key: OptionRow[0], values: string[]): OptionRow => {
  return [key, arrayLiteral(key, values)];
};

const objectLiteral = (entries: [string, string][], level: number): string => {
  const inner = entries
    .map(([key, value]) => {
      return `${indentOf(level + 1)}${quote(key)}: ${quote(value)},`;
    })
    .join('\n');

  return `{\n${inner}\n${indentOf(level)}}`;
};

const optionRows = (answers: Answers): OptionRow[] => {
  const target = targetFor(answers);
  const rows: OptionRow[] = [];

  if (target.framework !== undefined) {
    rows.push(['framework', quote(target.framework)]);
  }

  // This CLI generates TypeScript only.
  rows.push(['typescript', 'true']);

  // The layer imports @vitest/eslint-plugin, which dies on ERR_MODULE_NOT_FOUND without the suite.
  if (answers.testing === 'vitest') {
    rows.push(['vitest', 'true']);
  }

  if (target.html) {
    rows.push(['html', 'true']);
  }

  // A file type, so it stacks with the hosted framework.
  if (target.astro === true) {
    rows.push(['astro', 'true']);
  }

  const layers = LIBRARY_LAYERS
    .filter((layer) => {
      return LAYER_ANSWERS[layer](answers);
    });

  if (layers.length > 0) {
    rows.push(arrayRow('libraries', layers));
  }

  // Without the entry point `better-tailwindcss` warns once per class string: 63 on one real project.
  if (answers.styling === 'tailwind') {
    rows.push(['tailwindEntryPoint', quote(`./${target.styleEntry}`)]);
  }

  // A block: inline, the closing ` }` runs past `max-len`.
  const { resolveConditions } = answers;

  if (resolveConditions !== undefined) {
    const conditions = arrayLiteral('conditionNames', resolveConditions, 2);

    rows.push(['resolver', `{\n${indentOf(2)}conditionNames: ${conditions},\n${indentOf(1)}}`]);
  }

  rows.push(arrayRow('ignores', [
    ...BASE_IGNORES,
    ...target.ignores,
    ...answers.ignores ?? [],
  ]));
  rows.push(['aliases', objectLiteral(Object.entries(buildAliases(answers)), 1)]);
  rows.push(['naming', objectLiteral(Object.entries(target.naming), 1)]);
  rows.push(['folderNaming', objectLiteral(Object.entries(target.folderNaming), 1)]);

  return rows;
};

export const emitEslintConfig = (answers: Answers): string => {
  const options = optionRows(answers)
    .map(([key, value]) => {
      return `${indentOf(1)}${key}: ${value},`;
    })
    .join('\n');

  // import/no-anonymous-default-export reports a bare array.
  return [
    `import { composeConfig } from '${PACKAGE}';`,
    '',
    `const config = await composeConfig({\n${options}\n});`,
    '',
    'export default config;',
    '',
  ].join('\n');
};

export const eslintConfigEmitter = (answers: Answers): Artifact[] => {
  return [emitted('lint', 'eslint.config.js', emitEslintConfig(answers))];
};
