import {
  JSX_FIXTURE,
  ownBlockNames,
  ruleIdsFor,
  ruleIdsForFile,
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

import { reactCore, reactGroup } from './reactCoreUtils';

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

    await expect(ruleIdsFor(reactCore(), code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('react-hooks/rules-of-hooks');
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

    await expect(ruleIdsFor(reactCore(), code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('@linteljs/sort-hook-dependencies');
  });

  it('reports a component reading its props member by member', async () => {
    const code = [
      'export const Widget = (props) => {',
      '  return <div>{props.title}</div>;',
      '};',
      '',
    ].join('\n');

    await expect(ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('@linteljs/prefer-destructured-props');
  });

  it('stays quiet on a component that forwards its props whole', async () => {
    const code = [
      'export const Widget = (props) => {',
      '  return <input {...props} />;',
      '};',
      '',
    ].join('\n');

    await expect(ruleIdsFor([...base(), ...reactCore()], code, 'src/components/ui/Widget.tsx'))
      .resolves.not.toContain('@linteljs/prefer-destructured-props');
  });

  it('reports through the eslint-react preset it composes', async () => {
    const ruleIds = await ruleIdsForFile([
      ...base(),
      ...typescript(),
      ...reactCore(),
    ], JSX_FIXTURE);

    expect(ruleIds).toContain('@eslint-react/no-array-index-key');
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
    await expect(sortsAheadOfPackages(base({ frameworkGroup: reactGroup }), specifier)).resolves.toBe(true);
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

    await expect(ruleIdsFor(layer, block([
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-aria',
    ]), 'src/lib/a.ts'))
      .resolves.not.toContain('simple-import-sort/imports');
    await expect(ruleIdsFor(layer, block([
      'react',
      'react/jsx-runtime',
      'react-aria',
      'react-dom',
    ]), 'src/lib/a.ts'))
      .resolves.toContain('simple-import-sort/imports');
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

  it('names every block it writes', () => {
    expect(ownBlockNames(reactCore())).toEqual([
      '@linteljs/react/hooks-one-owner',
      '@linteljs/react',
    ]);
  });
});
