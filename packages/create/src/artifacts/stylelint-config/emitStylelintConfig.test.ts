import {
  describe,
  expect,
  it,
} from 'vitest';

import { DEFAULT_ANSWERS, TARGET_IDS } from '../../model/answers/answers';

import { emitStylelintConfig } from './emitStylelintConfig';

describe('emitStylelintConfig', () => {
  it('extends the standard and the property order', () => {
    const config = emitStylelintConfig(DEFAULT_ANSWERS);

    expect(config).toContain("'stylelint-config-standard',");
    expect(config).toContain("'stylelint-config-recess-order',");
    expect(config).toContain('export default config;');
  });

  // Without it every `@apply` in the project is an unknown-at-rule error, so the entry follows the tailwind answer
  // rather than being fixed either way.
  it('teaches stylelint the tailwind at-rules only when tailwind was chosen', () => {
    expect(emitStylelintConfig(DEFAULT_ANSWERS)).not.toContain('stylelint-config-tailwindcss');
    expect(emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      libraries: ['tailwind'],
    }))
      .toContain("'stylelint-config-tailwindcss',");
  });

  // Stylelint reads a `.vue` or `.svelte` file as plain CSS unless handed a syntax that knows where the `<style>` block
  // starts; without it those styles go unlinted entirely.
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
    expect(emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'react',
    })).not.toContain('postcss-html');
    expect(emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      target: 'webextension',
    }))
      .not.toContain('postcss-html');
  });

  // A CSS module's classes are camelCase JS properties, so the kebab-case demand can't be met; it's the one finding
  // `stylelint --fix` can't clear, leaving `lint:css` unpassable otherwise.
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

// A Tailwind 4 `@custom-variant` body is a bare `&` rule by design, which stylelint reads as dangling.
describe('the tailwind nesting carve-out', () => {
  it('stands the scoping-root rule down for a tailwind project', () => {
    expect(emitStylelintConfig({
      ...DEFAULT_ANSWERS,
      libraries: ['tailwind'],
    }))
      .toContain("'nesting-selector-no-missing-scoping-root': null,");
  });

  it('leaves it on for a project with no tailwind', () => {
    expect(emitStylelintConfig(DEFAULT_ANSWERS))
      .not.toContain('nesting-selector-no-missing-scoping-root');
  });
});
