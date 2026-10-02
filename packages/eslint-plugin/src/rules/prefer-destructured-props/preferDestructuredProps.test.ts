import { tsxRuleTester } from '@mocks/ruleTesters';

import { preferDestructuredProps } from './preferDestructuredProps.ts';

tsxRuleTester.run('prefer-destructured-props', preferDestructuredProps, {
  valid: [
    'const Widget = ({ alpha, bravo }) => alpha + bravo;',

    'const widget = (props) => props.alpha;',
    'function buildWidget(props) { return props.alpha; }',

    'const Widget = (props) => <input {...props} />;',
    'const Widget = (props) => render(props);',
    'function Widget(props) { return props; }',
    'const Widget = (props) => ({ ...props, active: true });',
    'const Widget = (props) => { const copy = props; return copy.alpha; };',

    'const Widget = (props) => { log(props); return props.alpha; };',

    'const Widget = (props) => { props = normalise(props); return props.alpha; };',

    'const Widget = (props) => data[props];',

    'const Widget = (props) => null;',
    'const Widget = () => null;',

    'export default function (props) { return props.alpha; }',

    'items.map((props) => props.alpha);',

    'const { length } = function (props) { return props.alpha; };',

    'const Widget = (props) => props[key];',
    'const Widget = (props) => { for (const key of keys) { render(props[key]); } return null; };',

    'const Widget = (props) => <props.Icon />;',

    'const Widget = (props = {}) => props.alpha;',

    'const Value = (function (props) { return props.alpha; })();',
    'const Value = (function (props) { return props.alpha; })(input);',
    'const Value = function (props) { return props.alpha; }(input);',

    'function Widget() { return null; }',

    'export default memo(function (props) { return props.alpha; });',
    'export default memo(function Widget(props) { return props.alpha; });',
    'const Widget = (...props) => props.length;',
    'const Widget = ({ alpha }, props) => alpha + props.bravo;',
    'const Widget = (props) => props[`alpha`];',
    'const Widget = (props: Props) => props!.alpha;',
    'const Widget = (props: Props) => (props as Props).alpha;',
    'const Widget = (props: Props): typeof props.alpha => props.alpha;',
    'class Panel { Render(props) { return props.alpha; } }',
    'const registry = { Widget: (props) => props.alpha };',
    'Widget = (props) => props.alpha;',
  ],
  invalid: [
    {
      code: 'function Widget(props) { return props.alpha; }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => props.alpha;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = function (props) { return props.alpha + props.bravo; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = function widget(props) { return props.alpha; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: "const Widget = (props) => props['alpha'];",
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => <div>{props.alpha}{props.bravo}</div>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => props?.alpha;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = memo((props) => props.alpha);',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = forwardRef((props, ref) => <div ref={ref}>{props.alpha}</div>);',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = memo(forwardRef((props, ref) => <div ref={ref}>{props.alpha}</div>));',
      errors: [{ messageId: 'destructure' }],
    },

    {
      code: 'const Widget = (props) => props[0] + props.alpha;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'export default function Widget(props) { return props.alpha; }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'export const Widget = async (props) => props.alpha;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Outer = (props) => { const Inner = (props) => props.bravo; return <Inner>{props.alpha}</Inner>; };',
      errors: [{ messageId: 'destructure' }, { messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => <Child value={props.alpha} {...props.rest} />;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (/* incoming */ props) => props.alpha;',
      errors: [{ messageId: 'destructure', column: 32 }],
    },
    {
      code: 'const Widget = (props: Props): JSX.Element => <div>{props.alpha}</div>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function Widget<T>(props: Props<T>) { return props.value; }',
      errors: [{ messageId: 'destructure' }],
    },
  ],
});
