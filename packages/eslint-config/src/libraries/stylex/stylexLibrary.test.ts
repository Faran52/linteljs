import { join } from 'node:path';

import {
  ruleIdsFor,
  ruleIdsForFile,
  SFC_FIXTURES,
  startsWith,
} from '@mocks/lintText';
import { ESLint } from 'eslint';
import {
  describe,
  expect,
  it,
} from 'vitest';

import astro from '../../frameworks/astro/astroFramework';
import react from '../../frameworks/react/reactFramework';
import svelte from '../../frameworks/svelte/svelteFramework';
import vue from '../../frameworks/vue/vueFramework';
import base from '../../layers/base/baseLayer';

import stylex from './stylexLibrary';

const layer = [...base(), ...react(), ...stylex()];

const IMPORT = "import * as stylex from '@stylexjs/stylex';";

// A style module the way the starters write one, with `rules` as the body of the one style.
const moduleWith = (rules: string, preamble: string[] = []): string => {
  return [
    IMPORT,
    ...preamble,
    '',
    'const sheet = stylex.create({',
    `  card: { ${rules} },`,
    '});',
    '',
    'export const styles = { card: stylex.props(sheet.card) };',
    '',
  ].join('\n');
};

describe('stylex', () => {
  // `allowRawCSSVars` waves a `var()` value through the rule's own check, which is where this bites.
  it('reports a shorthand StyleX compiles to nothing, even around a custom property', async () => {
    await expect(ruleIdsFor(layer, moduleWith("background: 'var(--card)'"), 'src/components/card/styles.ts'))
      .resolves.toContain('@stylexjs/valid-styles');
  });

  it('reports a shorthand carrying more than one value', async () => {
    await expect(ruleIdsFor(layer, moduleWith("padding: '1px 2px'"), 'src/components/card/styles.ts'))
      .resolves.toContain('@stylexjs/valid-shorthands');
  });

  it('splits a multi-value shorthand under --fix-type problem', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: layer,
      fix: true,
      fixTypes: ['problem'],
    });
    const [result] = await eslint.lintText(moduleWith("padding: '1px 2px'"), {
      filePath: 'src/components/card/styles.ts',
    });

    expect(result?.output).toContain("paddingBlock: '1px'");
  });

  it('reports a style nothing reads', async () => {
    const code = [
      IMPORT,
      '',
      "const sheet = stylex.create({ card: { color: 'red' }, unused: { color: 'blue' } });",
      '',
      'export const styles = { card: stylex.props(sheet.card) };',
      '',
    ].join('\n');

    await expect(ruleIdsFor(layer, code, 'src/components/card/styles.ts'))
      .resolves.toContain('@stylexjs/no-unused');
  });

  it('reports a pseudo-class written the legacy way, as a key of its own', async () => {
    await expect(ruleIdsFor(layer, moduleWith("color: 'red', ':hover': { color: 'blue' }"), 'src/card/styles.ts'))
      .resolves.toContain('@stylexjs/no-legacy-contextual-styles');
  });

  it('reports className beside a spread of stylex.props', async () => {
    const code = [
      IMPORT,
      '',
      "const sheet = stylex.create({ card: { color: 'red' } });",
      '',
      'export const Card = () => {',
      '  return <div {...stylex.props(sheet.card)} className="card">x</div>;',
      '};',
      '',
    ].join('\n');

    await expect(ruleIdsFor(layer, code, 'src/components/Card.tsx'))
      .resolves.toContain('@stylexjs/no-conflicting-props');
  });

  it('reports tokens defined outside a .stylex.ts file', async () => {
    const code = `${IMPORT}\n\nexport const tokens = stylex.defineVars({ primary: 'var(--primary)' });\n`;

    await expect(ruleIdsFor(layer, code, 'src/styles/tokens.ts'))
      .resolves.toContain('@stylexjs/enforce-extension');
    await expect(ruleIdsFor(layer, code, 'src/styles/tokens.stylex.ts'))
      .resolves.not.toContain('@stylexjs/enforce-extension');
  });

  // The rule reached for `context.getScope()` here, which ESLint removed, and the whole run threw.
  it('reports an imported number in a numeric property rather than crashing on it', async () => {
    const code = moduleWith('zIndex: LAYER', ["import { LAYER } from './layers';"]);

    await expect(ruleIdsFor(layer, code, 'src/components/card/styles.ts'))
      .resolves.toContain('@stylexjs/valid-styles');
  });

  it('stays quiet on longhands, tokens and contextual values', async () => {
    const code = moduleWith(
      "backgroundColor: 'var(--card)', borderWidth: '1px', opacity: { 'default': 1, ':hover': 0.88 }",
    );
    const ruleIds = await ruleIdsFor(layer, code, 'src/components/card/styles.ts');

    expect(ruleIds.some(startsWith('@stylexjs/'))).toBe(false);
  });

  it.each([
    ['vue', vue, 'StyledCard.vue'],
    ['svelte', svelte, 'StyledCard.svelte'],
  ])('reaches the script block of a %s component', async (_label, framework, file) => {
    await expect(ruleIdsForFile([...base(), ...framework(), ...stylex()], join(SFC_FIXTURES, file)))
      .resolves.toContain('@stylexjs/valid-styles');
  });

  // `astro()` last, the order `composeConfig` keeps.
  it('reaches the frontmatter of an astro page', async () => {
    const code = `---\n${moduleWith("background: 'var(--card)'")}---\n\n<div>x</div>\n`;

    await expect(ruleIdsFor([...base(), ...stylex(), ...astro()], code, 'src/pages/index.astro'))
      .resolves.toContain('@stylexjs/valid-styles');
  });
});
