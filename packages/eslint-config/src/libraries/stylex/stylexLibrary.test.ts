import { join } from 'node:path';

import {
  ownBlockNames,
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

const layer = [
  ...base(),
  ...react(),
  ...stylex(),
];

const IMPORT = "import * as stylex from '@stylexjs/stylex';";

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

const lintCard = async (code: string, fix: boolean): Promise<ESLint.LintResult | undefined> => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: layer,
    fix,
    fixTypes: ['problem'],
  });
  const [result] = await eslint.lintText(code, { filePath: 'src/components/card/styles.ts' });

  return result;
};

const fixed = async (code: string): Promise<string | undefined> => {
  return (await lintCard(code, true))?.output;
};

const lint = async (code: string): Promise<string[]> => {
  return (await lintCard(code, false))?.messages
    .map((message) => {
      return `${message.ruleId ?? ''}: ${message.message
        .split('\n')
        .at(-1) ?? ''}`;
    }) ?? [];
};

describe('stylex', () => {
  it('reports a shorthand StyleX compiles to nothing, even around a custom property', async () => {
    const ruleIds = await ruleIdsFor(layer, moduleWith("background: 'var(--card)'"), 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
  });

  it('reports a shorthand carrying more than one value', async () => {
    const ruleIds = await ruleIdsFor(layer, moduleWith("padding: '1px 2px'"), 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/valid-shorthands');
  });

  it('splits a multi-value shorthand under --fix-type problem', async () => {
    const actual = await fixed(moduleWith("padding: '1px 2px'"));
    expect(actual).toContain("paddingBlock: '1px'");
  });

  it('splits into physical longhands and drops !important', async () => {
    const output = await fixed(moduleWith("margin: '1px 2px 3px 4px !important'"));

    expect(output).toContain("marginRight: '2px',");
    expect(output).not.toContain('!important');
  });

  it('leaves a logical border shorthand to be fixed by hand', async () => {
    const actual = await fixed(moduleWith("borderBlockEnd: '1px solid red'"));
    expect(actual).toBeUndefined();
  });

  it.each([
    'animation',
    'background',
    'borderBlock',
    'borderInline',
  ])('says why %s is refused', async (prop) => {
    const messages = await lint(moduleWith(`${prop}: 'var(--card)'`));

    expect(messages).toContain('@stylexjs/valid-styles: StyleX drops this shorthand with no error. Use the longhands.');
  });

  it('reads the legacy stylex import too', async () => {
    const code = moduleWith("background: 'var(--card)'").replace("'@stylexjs/stylex'", "'stylex'");

    const ruleIds = await ruleIdsFor(layer, code, 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
  });

  it('takes a custom property as a key', async () => {
    const ruleIds = await ruleIdsFor(layer, moduleWith("'--card-gap': '4px'"), 'src/components/card/styles.ts');

    const anyMatch = ruleIds.some(startsWith('@stylexjs/'));
    expect(anyMatch).toBe(false);
  });

  it('names its one block', () => {
    const actual = ownBlockNames(stylex());
    const expected = ['@linteljs/stylex'];
    expect(actual).toEqual(expected);
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

    const ruleIds = await ruleIdsFor(layer, code, 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/no-unused');
  });

  it('reports a pseudo-class written the legacy way, as a key of its own', async () => {
    const code = moduleWith("color: 'red', ':hover': { color: 'blue' }");
    const ruleIds = await ruleIdsFor(layer, code, 'src/card/styles.ts');

    expect(ruleIds).toContain('@stylexjs/no-legacy-contextual-styles');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
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

    const ruleIds = await ruleIdsFor(layer, code, 'src/components/Card.tsx');
    expect(ruleIds).toContain('@stylexjs/no-conflicting-props');
  });

  it.each([
    [
      '@stylexjs/valid-shorthands',
      moduleWith("padding: '1px 2px'"),
      'src/components/card/styles.ts',
    ],
    [
      '@stylexjs/no-unused',
      `${IMPORT}\n\nconst sheet = stylex.create({ card: { color: 'red' }, unused: { color: 'blue' } });\n\n`
      + 'export const styles = { card: stylex.props(sheet.card) };\n',
      'src/components/card/styles.ts',
    ],
    [
      '@stylexjs/no-legacy-contextual-styles',
      moduleWith("color: 'red', ':hover': { color: 'blue' }"),
      'src/card/styles.ts',
    ],
    [
      '@stylexjs/no-conflicting-props',
      `${IMPORT}\n\nconst sheet = stylex.create({ card: { color: 'red' } });\n\n`
      + 'export const Card = () => {\n  return <div {...stylex.props(sheet.card)} className="card">x</div>;\n};\n',
      'src/components/Card.tsx',
    ],
    [
      '@stylexjs/enforce-extension',
      `${IMPORT}\n\nexport const tokens = stylex.defineVars({ primary: 'var(--primary)' });\n`,
      'src/styles/tokens.ts',
    ],
  ])('reports %s under the legacy stylex import too', async (rule, code, path) => {
    const legacy = code.replace("'@stylexjs/stylex'", "'stylex'");

    const ruleIds = await ruleIdsFor(layer, legacy, path);
    expect(ruleIds).toContain(rule);
  });

  it('reports tokens defined outside a .stylex.ts file', async () => {
    const code = `${IMPORT}\n\nexport const tokens = stylex.defineVars({ primary: 'var(--primary)' });\n`;

    const ruleIds = await ruleIdsFor(layer, code, 'src/styles/tokens.ts');
    expect(ruleIds).toContain('@stylexjs/enforce-extension');

    const layerRuleIds = await ruleIdsFor(layer, code, 'src/styles/tokens.stylex.ts');
    expect(layerRuleIds).not.toContain('@stylexjs/enforce-extension');
  });

  it('keeps a .stylex.ts file to its tokens', async () => {
    const code = `${IMPORT}\n\nexport const tokens = stylex.defineVars({ primary: 'red' });\nexport const other = 1;\n`;

    const ruleIds = await ruleIdsFor(layer, code, 'src/styles/tokens.stylex.ts');
    expect(ruleIds).toContain('@stylexjs/enforce-extension');
  });

  it('takes constants in a .stylex.ts file', async () => {
    const code = `${IMPORT}\n\nexport const sizes = stylex.defineConsts({ small: '4px' });\n`;

    const ruleIds = await ruleIdsFor(layer, code, 'src/styles/tokens.stylex.ts');
    expect(ruleIds).not.toContain('@stylexjs/enforce-extension');
  });

  it('reports an imported number in a numeric property rather than crashing on it', async () => {
    const code = moduleWith('zIndex: LAYER', ["import { LAYER } from './layers';"]);

    const ruleIds = await ruleIdsFor(layer, code, 'src/components/card/styles.ts');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
  });

  it('stays quiet on longhands, tokens and contextual values', async () => {
    const code = moduleWith(
      "backgroundColor: 'var(--card)', borderWidth: '1px', opacity: { 'default': 1, ':hover': 0.88 }",
    );
    const ruleIds = await ruleIdsFor(layer, code, 'src/components/card/styles.ts');

    const anyMatch = ruleIds.some(startsWith('@stylexjs/'));
    expect(anyMatch).toBe(false);
  });

  it.each([
    [
      'vue',
      vue,
      'StyledCard.vue',
    ],
    [
      'svelte',
      svelte,
      'StyledCard.svelte',
    ],
  ])('reaches the script block of a %s component', async (_label, framework, file) => {
    const actual = await ruleIdsForFile([
      ...base(),
      ...framework(),
      ...stylex(),
    ], join(SFC_FIXTURES, file));
    expect(actual).toContain('@stylexjs/valid-styles');
  });

  it('reaches the frontmatter of an astro page', async () => {
    const code = `---\n${moduleWith("background: 'var(--card)'")}---\n\n<div>x</div>\n`;

    const ruleIds = await ruleIdsFor([
      ...base(),
      ...stylex(),
      ...astro(),
    ], code, 'src/pages/index.astro');
    expect(ruleIds).toContain('@stylexjs/valid-styles');
  });
});
