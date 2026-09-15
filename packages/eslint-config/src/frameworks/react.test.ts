import {
  JSX_FIXTURE,
  ruleIdsFor,
  ruleIdsForFile,
} from '@mocks/lintText';
import {
  describe,
  expect,
  it,
} from 'vitest';

import base from '../base';
import typescript from '../typescript';

import react from './react';

describe('react', () => {
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

    await expect(ruleIdsFor(react(), code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('react-hooks/rules-of-hooks');
  });

  it('reports an unsorted hook dependency array through the lintel rule it adds', async () => {
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

    await expect(ruleIdsFor(react(), code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('@linteljs/sort-hook-dependencies');
  });

  it('reports a component reading its props member by member', async () => {
    const code = [
      'export const Widget = (props) => {',
      '  return <div>{props.title}</div>;',
      '};',
      '',
    ].join('\n');

    await expect(ruleIdsFor([...base(), ...react()], code, 'src/components/ui/Widget.tsx'))
      .resolves.toContain('@linteljs/prefer-destructured-props');
  });

  it('stays quiet on a component that forwards its props whole', async () => {
    const code = [
      'export const Widget = (props) => {',
      '  return <input {...props} />;',
      '};',
      '',
    ].join('\n');

    await expect(ruleIdsFor([...base(), ...react()], code, 'src/components/ui/Widget.tsx'))
      .resolves.not.toContain('@linteljs/prefer-destructured-props');
  });

  // The cases above pin only `react-hooks` and two lintel rules; a renamed preset key would leave them green.
  it('reports through the eslint-react preset it composes', async () => {
    const ruleIds = await ruleIdsForFile([...base(), ...typescript(), ...react()], JSX_FIXTURE);

    expect(ruleIds).toContain('@eslint-react/no-array-index-key');
  });

  it('reports an image with no alt text', async () => {
    const code = 'export const Logo = () => {\n  return <img src="/a.png" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/Logo.tsx');

    expect(ruleIds).toContain('jsx-a11y/alt-text');
  });

  it('reports an aria attribute that is not a real one', async () => {
    const code = 'export const Box = () => {\n  return <div aria-nonsense="x">a</div>;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/Box.tsx');

    expect(ruleIds).toContain('jsx-a11y/aria-props');
  });

  it('reports a JSX prop named twice on one element', async () => {
    const code = 'export const Chip = () => {\n  return <span className="a" className="b" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).toContain('@linteljs/no-duplicate-jsx-props');
  });

  // The documented override idiom.
  it('stays quiet when a spread sits between two same-named props', async () => {
    const code = 'export const Chip = (props) => {\n'
      + '  return <span className="default" {...props} className="override" />;\n};\n';
    const ruleIds = await ruleIdsFor([...base(), ...react()], code, 'src/components/ui/Chip.tsx');

    expect(ruleIds).not.toContain('@linteljs/no-duplicate-jsx-props');
  });
});
