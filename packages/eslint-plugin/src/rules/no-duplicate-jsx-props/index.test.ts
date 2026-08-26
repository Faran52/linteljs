import { tsxRuleTester } from '@mocks/ruleTesters';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { attributesOf, noDuplicateJsxProps } from './index.ts';

tsxRuleTester.run('no-duplicate-jsx-props', noDuplicateJsxProps, {
  valid: [
    'const view = <span className="a" id="b" />;',
    // A shorthand attribute is a name like any other, so one shorthand beside its spelled-out twin is fine.
    'const view = <button disabled type="button">go</button>;',
    // Namespaced names compare by their full text.
    'const view = <use xlink:href="#a" xlink:title="b" />;',
    'const view = <text xml:lang="en" lang="en" />;',
    // Two occurrences with a spread between are the documented override idiom.
    'const view = <span className="a" {...props} className="b" />;',
    'const view = <span a={1} {...first} b={2} {...second} a={3} />;',
    // Each opening element starts from an empty set.
    'const view = <><span a={1} /><span a={2} /></>;',
    {
      code: 'const view = <span\n  className="a"\n  id="b"\n  title="c"\n/>;',
      options: [],
    },
  ],
  invalid: [
    {
      code: 'const view = <span className="a" className="b" />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'className' },
      }],
    },
    {
      // The report sits on the second occurrence, not the first.
      code: 'const view = <span\n  className="a"\n  id="b"\n  className="b"\n/>;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'className' },
      }],
    },
    {
      code: 'export const DupProbe = () => {\n  return <span className="a" className="b" />;\n};',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'className' },
      }],
    },
    {
      // Three occurrences report twice.
      code: 'const view = <span a={1} a={2} a={3} />;',
      errors: [
        {
          messageId: 'duplicateProp',
          data: { name: 'a' },
        },
        {
          messageId: 'duplicateProp',
          data: { name: 'a' },
        },
      ],
    },
    {
      // A duplicate stays one however many distinct props sit between the pair.
      code: 'const view = <span a={1} b={2} c={3} a={4} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
      }],
    },
    {
      // The reset ends at the spread: after it, counting starts over, so this third occurrence reports.
      code: 'const view = <span a={1} {...props} a={2} a={3} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
      }],
    },
    {
      // Both occurrences sit after the spread, so the reset never comes between them.
      code: 'const view = <span {...props} className="a" className="b" />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'className' },
      }],
    },
    {
      // A shorthand duplicates its spelled-out twin.
      code: 'const view = <button disabled disabled />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'disabled' },
      }],
    },
    {
      code: 'const view = <use xlink:href="#a" xlink:href="#b" />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'xlink:href' },
      }],
    },
    {
      // A namespaced name and its bare suffix are different props.
      code: 'const view = <use xlink:href="#a" href="#b" href="#c" />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'href' },
      }],
    },
  ],
});

describe('attributesOf', () => {
  // A rule run only ever hands the listener a real opening element, so the shapes this declines are
  // reachable from a direct call alone.
  it.each([
    ['a node carrying no attributes', { type: 'Identifier' }],
    ['attributes that are not a list', {
      type: 'JSXOpeningElement',
      attributes: 'className',
    }],
  ])('declines %s', (_label, value) => {
    expect(attributesOf(value)).toEqual([]);
  });
});
