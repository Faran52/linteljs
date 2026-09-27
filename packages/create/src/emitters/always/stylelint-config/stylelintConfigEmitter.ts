import { type Answers, type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

import {
  CSS_MODULE_OVERRIDE,
  IMPORT_NOTATION,
  type StyleOverride,
  TAILWIND_RULES,
} from './constants';

// `stylelint-config-tailwindcss` teaches it Tailwind's at-rules; without it every `@apply` is unknown.

// Without a `customSyntax` a `.vue` or `.svelte` file's styles go unlinted entirely.
const sfcOverride = (extension: string): StyleOverride => {
  return {
    files: `**/*.${extension}`,
    body: ["customSyntax: 'postcss-html',"],
  };
};

const overridesFor = (overrides: StyleOverride[]): string => {
  const blocks = overrides.map(({ files, body }) => {
    const lines = body.map((line) => {
      return `      ${line}`;
    });

    return `    {\n      files: ['${files}'],\n${lines.join('\n')}\n    },`;
  });

  return `\n  overrides: [\n${blocks.join('\n')}\n  ],`;
};

export const emitStylelintConfig = (answers: Answers): string => {
  const extended = [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    ...(answers.styling === 'tailwind' ? ['stylelint-config-tailwindcss'] : []),
  ];

  const entries = extended
    .map((name) => {
      return `    '${name}',`;
    })
    .join('\n');

  const { sfcExtension } = targetFor(answers);
  const overrides = overridesFor([
    ...(sfcExtension === undefined ? [] : [sfcOverride(sfcExtension)]),
    CSS_MODULE_OVERRIDE,
  ]);

  const declared = [
    ...IMPORT_NOTATION,
    ...(answers.styling === 'tailwind' ? TAILWIND_RULES : []),
  ];
  const rules = `\n  rules: {\n  ${declared.join('\n  ')}\n  },`;

  return `const config = {\n  extends: [\n${entries}\n  ],${rules}${overrides}\n};\n\nexport default config;\n`;
};

// The directory is named for `stylelint.config.js`, so the path is spelled here and nowhere else.
export const stylelintConfigEmitter = (answers: Answers): Artifact[] => {
  return [emitted('lint', 'stylelint.config.js', emitStylelintConfig(answers))];
};
