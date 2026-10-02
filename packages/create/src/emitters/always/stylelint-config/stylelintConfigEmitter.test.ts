import {
  describe,
  expect,
  it,
} from 'vitest';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS, DEFAULT_ANSWERS } from '@answers';

import { emitStylelintConfig, stylelintConfigEmitter } from './stylelintConfigEmitter';

const TARGET_IDS = valuesOf(ANSWERS.target.values);

const PLAIN = `const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  rules: {
    'import-notation': 'string',
  },
  overrides: [
    {
      files: ['**/*.module.css'],
      rules: {
        'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',
      },
    },
  ],
};

export default config;
`;

const SFC_WITH_TAILWIND = `const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    'stylelint-config-tailwindcss',
  ],
  rules: {
    'import-notation': 'string',
    'nesting-selector-no-missing-scoping-root': null,
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.module.css'],
      rules: {
        'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',
      },
    },
  ],
};

export default config;
`;

describe('emitStylelintConfig', () => {
  it('extends the standard and the property order', () => {
    const stylelintConfig = emitStylelintConfig(DEFAULT_ANSWERS);
    expect(stylelintConfig).toBe(PLAIN);

    const config = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'vue',
      styling: 'tailwind',
    });

    expect(config).toBe(SFC_WITH_TAILWIND);
  });

  it('teaches stylelint the tailwind at-rules only when tailwind was chosen', () => {
    const plain = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      libraries: [],
    });

    expect(plain).not.toContain('stylelint-config-tailwindcss');

    const withTailwind = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      libraries: [],
      styling: 'tailwind',
    });

    expect(withTailwind).toContain("'stylelint-config-tailwindcss',");
  });

  it('parses the SFC style block on the two targets that have one', () => {
    const vue = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'vue',
    });
    const svelte = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'svelte',
    });

    expect(vue).toContain("files: ['**/*.vue'],");
    expect(vue).toContain("customSyntax: 'postcss-html',");
    expect(svelte).toContain("files: ['**/*.svelte'],");
    expect(svelte).toContain("customSyntax: 'postcss-html',");
  });

  it('hands no SFC syntax to a target with no single-file component', () => {
    const onReact = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'react',
    });

    expect(onReact).not.toContain('postcss-html');

    const onExtension = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    });

    expect(onExtension).not.toContain('postcss-html');
  });

  it('lets a CSS module keep the camelCase classes its consumer reads', () => {
    for (const target of TARGET_IDS) {
      const config = emitStylelintConfig({
        ...DEFAULT_ANSWERS,
        target,
      });

      expect(config).toContain("files: ['**/*.module.css'],");
      expect(config).toContain("'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',");
    }
  });
});

describe('the import notation', () => {
  it('pins the string form for every project, whatever styles it', () => {
    const stylings = [
      undefined,
      'tailwind',
      'stylex',
    ] as const;

    for (const target of TARGET_IDS) {
      for (const styling of stylings) {
        const config = emitStylelintConfig({
          ...DEFAULT_ANSWERS,
          libraries: [],
          target,
          ...(styling === undefined ? {} : { styling }),
        });

        expect(config).toContain("'import-notation': 'string',");
      }
    }
  });
});

describe('the tailwind nesting carve-out', () => {
  it('stands the scoping-root rule down for a tailwind project', () => {
    const config = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      libraries: [],
      styling: 'tailwind',
    });

    expect(config).toContain("'nesting-selector-no-missing-scoping-root': null,");
  });

  it('leaves it on for a project with no tailwind', () => {
    const config = emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      libraries: [],
    });

    expect(config).not.toContain('nesting-selector-no-missing-scoping-root');
  });
});

describe('stylelintConfigEmitter', () => {
  it('writes the emitted text to stylelint.config.js at the lint stage', () => {
    const stylelintConfig = stylelintConfigEmitter(DEFAULT_ANSWERS);
    const expected = [{
      stage: 'lint',
      target: 'stylelint.config.js',
      content: { text: emitStylelintConfig(DEFAULT_ANSWERS) },
    }];
    expect(stylelintConfig).toEqual(expected);
  });
});
