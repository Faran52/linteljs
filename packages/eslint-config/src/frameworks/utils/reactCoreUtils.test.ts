import {
  JSX_FIXTURE,
  ownBlockNames,
  ruleEntryFor,
  ruleIdsFor,
  ruleIdsForFile,
  ruleNamesFor,
  sortsAheadOfPackages,
} from '@mocks/lintText';
import { layerWithout, layerWithoutConfig } from '@mocks/presets';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../../layers/base/baseLayer';
import typescript from '../../layers/typescript/typescriptLayer';
import solid from '../solid/solidFramework';

import { reactCore, reactGroup } from './reactCoreUtils';

import type { Linter } from 'eslint';

interface FlatConfigs {
  flat: object;
}

interface FlatNamespaced {
  configs: FlatConfigs;
}

describe('reactCore', () => {
  it('reports a hook called inside a condition', async () => {
    const code = [
      "import { useState } from 'react';",
      '',
      'export const Widget = ({ on }) => {',
      '  if (on) {',
      '    const [value] = useState(1);',
      '',
      '    return value;',
      '  }',
      '',
      '  return 0;',
      '};',
      '',
    ].join('\n');

    const ruleIds = await ruleIdsFor(reactCore(), code, 'src/components/ui/Widget.tsx');
    expect(ruleIds).toContain('react-hooks/rules-of-hooks');
  });

  it('reports an unsorted hook dependency array through the linteljs rule it adds', async () => {
    const code = [
      "import { useEffect } from 'react';",
      '',
      'export const Widget = ({ b, a }) => {',
      '  useEffect(() => {',
      '    console.warn(a, b);',
      '  }, [b, a]);',
      '',
      '  return null;',
      '};',
      '',
    ].join('\n');

    const ruleIds = await ruleIdsFor(reactCore(), code, 'src/components/ui/Widget.tsx');
    expect(ruleIds).toContain('@linteljs/sort-hook-dependencies');
  });

  it('reports a component reading its props member by member', async () => {
    const code = [
      'export const Widget = (props) => {',
      '  return <div>{props.title}</div>;',
      '};',
      '',
    ].join('\n');

    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Widget.tsx');
    expect(ruleIds).toContain('@linteljs/prefer-destructured-props');
  });

  it('stays quiet on a component that forwards its props whole', async () => {
    const code = [
      'export const Widget = (props) => {',
      '  return <input {...props} />;',
      '};',
      '',
    ].join('\n');

    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Widget.tsx');
    expect(ruleIds).not.toContain('@linteljs/prefer-destructured-props');
  });

  it('reports through the eslint-react preset it composes', async () => {
    const ruleIds = await ruleIdsForFile([
      ...base(),
      ...typescript(),
      ...reactCore(),
    ], JSX_FIXTURE);

    expect(ruleIds).toContain('@eslint-react/no-array-index-key');
  });

  it.each([
    ['@stylistic/jsx-self-closing-comp', '<div></div>'],
    ['@stylistic/jsx-pascal-case', '<My_Box />'],
  ])('reports %s', async (rule, element) => {
    const code = `export const Chip = () => {\n  return ${element};\n};\n`;
    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain(rule);
  });

  it('reports a single-quoted jsx attribute', async () => {
    const layer = [...base(), ...reactCore()];
    const code = "export const Widget = () => {\n  return <div className='x' />;\n};\n";

    const ruleIds = await ruleIdsFor(layer, code, 'src/components/ui/Widget.tsx');
    expect(ruleIds).toContain('@stylistic/jsx-quotes');
  });

  it('caps a single-line tag at two props and a multiline one at one per line', async () => {
    const layer = [...base(), ...reactCore()];
    const widget = 'src/components/ui/Widget.tsx';
    const two = 'export const Widget = () => {\n  return <div id="a" lang="b" />;\n};\n';
    const three = 'export const Widget = () => {\n  return <div id="a" lang="b" title="c" />;\n};\n';
    const multiline = 'export const Widget = () => {\n  return (\n    <div\n      id="a" lang="b"\n    />\n  );\n};\n';

    const ruleIds = await ruleIdsFor(layer, two, widget);
    expect(ruleIds).not.toContain('@stylistic/jsx-max-props-per-line');
    const layerRuleIds = await ruleIdsFor(layer, three, widget);
    expect(layerRuleIds).toContain('@stylistic/jsx-max-props-per-line');
    const ruleIds2 = await ruleIdsFor(layer, multiline, widget);
    expect(ruleIds2).toContain('@stylistic/jsx-max-props-per-line');
  });

  it('reports a state setter called with its own state, a sonarjs React rule base leaves off', async () => {
    const code = [
      "import { useState } from 'react';",
      '',
      'export const Chip = () => {',
      '  const [open, setOpen] = useState(false);',
      '  const close = () => {',
      '    setOpen(open);',
      '  };',
      '',
      '  return <button onClick={close}>x</button>;',
      '};',
      '',
    ].join('\n');
    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain('sonarjs/no-useless-react-setstate');
  });

  it('reports a JSX prop named twice on one element', async () => {
    const code = 'export const Chip = () => {\n  return <span className="a" className="b" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain('@linteljs/no-duplicate-jsx-props');
  });

  it('stays quiet when a spread sits between two same-named props', async () => {
    const code = 'export const Chip = (props) => {\n'
      + '  return <span className="default" {...props} className="override" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).not.toContain('@linteljs/no-duplicate-jsx-props');
  });

  it.each([
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react-native',
    '@react-navigation/native',
  ])('sorts %s into its own bucket ahead of the packages', async (specifier) => {
    const actual = await sortsAheadOfPackages(base({ frameworkGroup: reactGroup }), specifier);
    expect(actual).toBe(true);
  });

  it('sorts react-dom straight after react, ahead of react/ and the react-* packages', async () => {
    const block = (specifiers: string[]): string => {
      return [
        ...specifiers
          .map((specifier, index) => {
            return `import { a${String(index)} } from '${specifier}';`;
          }),
        '',
        'export const value = 1;',
        '',
      ].join('\n');
    };

    const layer = base({ frameworkGroup: reactGroup });

    const ruleIds = await ruleIdsFor(layer, block([
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-aria',
    ]), 'src/lib/a.ts');
    expect(ruleIds).not.toContain('simple-import-sort/imports');

    const layerRuleIds = await ruleIdsFor(layer, block([
      'react',
      'react/jsx-runtime',
      'react-aria',
      'react-dom',
    ]), 'src/lib/a.ts');
    expect(layerRuleIds).toContain('simple-import-sort/imports');
  });

  it.each([
    ['recommended-typescript', 'eslint-react/typescript'],
  ])('names %s when @eslint-react/eslint-plugin stops publishing it', async (key, label) => {
    const layer = await layerWithoutConfig('@eslint-react/eslint-plugin', key, async () => {
      return (await import('./reactCoreUtils')).reactCore;
    });

    expect(layer).toThrow(`${label} is not published`);
  });

  it('names the hooks preset when its plugin stops publishing it', async () => {
    const layer = await layerWithout('eslint-plugin-react-hooks', (plugin: FlatNamespaced) => {
      return {
        ...plugin,
        configs: {
          ...plugin.configs,
          flat: {
            ...plugin.configs.flat,
            recommended: undefined,
          },
        },
      };
    }, async () => {
      return (await import('./reactCoreUtils')).reactCore;
    });

    expect(layer).toThrow('react-hooks/flat/recommended is not published');
  });

  it.each([
    ['@eslint-react/jsx-no-children-prop', [
      'export const Chip = () => {',
      '  return <div children="a" />;',
      '};',
    ]],
    ['@eslint-react/jsx-no-useless-fragment', [
      'export const Chip = () => {',
      '  return <><span /></>;',
      '};',
    ]],
    ['@eslint-react/no-class-component', [
      "import { Component } from 'react';",
      '',
      'export class Chip extends Component {',
      '  render() {',
      '    return null;',
      '  }',
      '}',
    ]],
    ['@eslint-react/no-misused-capture-owner-stack', [
      "import { captureOwnerStack } from 'react';",
      '',
      'export const stack = captureOwnerStack();',
    ]],
    ['@eslint-react/no-unstable-context-value', [
      "import { createContext } from 'react';",
      '',
      'const ThemeContext = createContext({ dark: false });',
      '',
      'export const Chip = ({ dark }: Readonly<{ dark: boolean }>) => {',
      '  const theme = { dark };',
      '',
      '  return <ThemeContext value={theme}><span /></ThemeContext>;',
      '};',
    ]],
    ['@eslint-react/no-unstable-default-props', [
      'export const Chip = ({ items = [] }: { items?: string[] }) => {',
      '  return <span>{items.length}</span>;',
      '};',
    ]],
    ['@eslint-react/use-state', [
      "import { useState } from 'react';",
      '',
      'export const Chip = () => {',
      '  const [open, change] = useState(false);',
      '',
      '  return <span onClick={() => change(!open)} />;',
      '};',
    ]],
    ['react-hooks/void-use-memo', [
      "import { useMemo } from 'react';",
      '',
      'export const Chip = ({ items }: { items: string[] }) => {',
      '  useMemo(() => {',
      '    items.sort();',
      '  }, [items]);',
      '',
      '  return <span />;',
      '};',
    ]],
  ])('reports %s', async (ruleId, lines) => {
    const code = `${lines.join('\n')}\n`;
    const ruleIds = await ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain(ruleId);
  });

  const ADDED_RULES: [string, Linter.RuleEntry][] = [
    ['@eslint-react/jsx-no-children-prop', [2]],
    ['@eslint-react/jsx-no-useless-fragment', [2, {
      allowEmptyFragment: false,
      allowExpressions: true,
    }]],
    ['@eslint-react/no-class-component', [2]],
    ['@eslint-react/no-misused-capture-owner-stack', [2]],
    ['@eslint-react/no-unstable-context-value', [2]],
    ['@eslint-react/no-unstable-default-props', [2, { safeDefaultProps: [] }]],
    ['@eslint-react/use-state', [2, {
      enforceAssignment: true,
      enforceLazyInitialization: true,
      enforceSetterName: true,
    }]],
    ['react-hooks/void-use-memo', [2]],
  ];

  it.each(ADDED_RULES)('sets %s with its options', async (ruleId, expected) => {
    const entry = await ruleEntryFor(reactCore(), 'src/a.tsx', ruleId);

    expect(entry).toEqual(expected);
  });

  it.each(ADDED_RULES)('leaves %s out of base and solid', async (ruleId) => {
    const baseRuleNames = await ruleNamesFor(base(), 'src/a.tsx');
    const solidRuleNames = await ruleNamesFor(solid(), 'src/a.tsx');

    expect(baseRuleNames).not.toContain(ruleId);
    expect(solidRuleNames).not.toContain(ruleId);
  });

  it('names every block it writes', () => {
    const actual = ownBlockNames(reactCore());
    const expected = [
      '@linteljs/react/hooks-one-owner',
      '@linteljs/react/sonarjs',
      '@linteljs/react',
    ];
    expect(actual).toEqual(expected);
  });
});
