import { tsxRuleTester } from '@mocks/ruleTesters';

import { noDuplicateJsxProps } from './noDuplicateJsxPropsRule.ts';

tsxRuleTester.run('no-duplicate-jsx-props', noDuplicateJsxProps, {
  valid: [
    'const view = <span className="a" id="b" />;',
    'const view = <button disabled type="button">go</button>;',
    'const view = <use xlink:href="#a" xlink:title="b" />;',
    'const view = <text xml:lang="en" lang="en" />;',
    'const view = <span className="a" {...props} className="b" />;',
    'const view = <span a={1} {...first} b={2} {...second} a={3} />;',
    'const view = <><span a={1} /><span a={2} /></>;',
    {
      code: 'const view = <span\n  className="a"\n  id="b"\n  title="c"\n/>;',
      options: [],
    },

    // Namespaces compare whole, and names compare by case.
    'const view = <use xlink:href="#a" xml:href="#b" />;',
    'const view = <span onClick={a} onclick={b} />;',

    // A parent and its child are separate elements.
    'const view = <div a={1}><span a={2} /></div>;',
    'const view = <Foo.Bar a={1} b={2} />;',
    'const view = <Foo<string> a={1} b={2} />;',
    'const view = <span {...a} {...a} />;',
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
      code: 'const view = <span a={1} b={2} c={3} a={4} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
      }],
    },
    {
      code: 'const view = <span a={1} {...props} a={2} a={3} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
      }],
    },
    {
      code: 'const view = <span {...props} className="a" className="b" />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'className' },
      }],
    },
    {
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
      code: 'const view = <use xlink:href="#a" href="#b" href="#c" />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'href' },
      }],
    },
    {
      code: 'const view = <div a={1}>\n  <span a={2} a={3} />\n</div>;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
        line: 2,
        column: 15,
        endLine: 2,
        endColumn: 20,
      }],
    },
    {
      code: 'const view = <Foo.Bar a={1} /* again */ a={2} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
        column: 41,
        endColumn: 46,
      }],
    },
    {
      code: 'const view = <Foo<string> a={1} a={2} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
      }],
    },
    {
      code: 'const view = <span a="x" a {...props} />;',
      errors: [{
        messageId: 'duplicateProp',
        data: { name: 'a' },
        column: 26,
        endColumn: 27,
      }],
    },
  ],
});
