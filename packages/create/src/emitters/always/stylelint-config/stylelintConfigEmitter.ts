import { type Answers, type Artifact } from '@config/types';

import { targetFor } from '@targets';

import { emitted } from '../../utils/artifactUtils';

import {
  CSS_MODULE_OVERRIDE,
  IMPORT_NOTATION,
  type StyleOverride,
  TAILWIND_RULES,
} from './constants';

// Without `stylelint-config-tailwindcss` every `@apply` is unknown.

// Without a `customSyntax` a `.vue` or `.svelte` file's styles go unlinted.
const sfcOverride = (extension: string): StyleOverride => {
  const override: StyleOverride = {
    files: `**/*.${extension}`,
    body: ["customSyntax: 'postcss-html',"],
  };

  return override;
};

const overridesFor = (overrides: StyleOverride[]): string => {
  const blocks = overrides
    .map(({ files, body }) => {
      const lines = body
        .map((line) => {
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

export const stylelintConfigEmitter = (answers: Answers): Artifact[] => {
  const config = emitStylelintConfig(answers);
  const artifacts = [emitted('lint', 'stylelint.config.js', config)];

  return artifacts;
};
