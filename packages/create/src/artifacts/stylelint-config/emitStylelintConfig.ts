import { type Answers, hasLibrary } from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

// `stylelint-config-tailwindcss` teaches it Tailwind's at-rules; without it every `@apply` is unknown.

interface StyleOverride {
  files: string;
  body: string[];
}

// Without a `customSyntax` a `.vue` or `.svelte` file's styles go unlinted entirely.
const sfcOverride = (extension: string): StyleOverride => {
  return {
    files: `**/*.${extension}`,
    body: ["customSyntax: 'postcss-html',"],
  };
};

// A CSS module's class names are camelCase JS properties; the kebab-case demand is the one finding `--fix` cannot
// clear.
const CSS_MODULE_OVERRIDE: StyleOverride = {
  files: '**/*.module.css',
  body: [
    'rules: {',
    "  'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',",
    '},',
  ],
};

// A Tailwind 4 `@custom-variant` body is a bare `&` rule, which stylelint reads as dangling. Off for a Tailwind
// project only.
const TAILWIND_RULES = [
  'rules: {',
  "  'nesting-selector-no-missing-scoping-root': null,",
  '},',
];

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
    ...(hasLibrary(answers, 'tailwind') ? ['stylelint-config-tailwindcss'] : []),
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

  const rules = hasLibrary(answers, 'tailwind')
    ? `\n  ${TAILWIND_RULES.join('\n  ')}`
    : '';

  return `const config = {\n  extends: [\n${entries}\n  ],${rules}${overrides}\n};\n\nexport default config;\n`;
};
