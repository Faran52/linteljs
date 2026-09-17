import { tsxRuleTester } from '@mocks/ruleTesters';

import { preferDestructuredProps } from './preferDestructuredProps.ts';

tsxRuleTester.run('prefer-destructured-props', preferDestructuredProps, {
  valid: [
    'const Widget = ({ alpha, bravo }) => alpha + bravo;',

    // A lowercase name is a hook or a helper, where a bag of options is an ordinary parameter.
    'const widget = (props) => props.alpha;',
    'function buildWidget(props) { return props.alpha; }',

    // Forwarded whole, so the object itself is wanted.
    'const Widget = (props) => <input {...props} />;',
    'const Widget = (props) => render(props);',
    'function Widget(props) { return props; }',
    'const Widget = (props) => ({ ...props, active: true });',
    'const Widget = (props) => { const copy = props; return copy.alpha; };',

    // One member read beside one whole use still keeps the object itself in play.
    'const Widget = (props) => { log(props); return props.alpha; };',

    'const Widget = (props) => { props = normalise(props); return props.alpha; };',

    // The identifier is the computed key here, not the object being read.
    'const Widget = (props) => data[props];',

    'const Widget = (props) => null;',
    'const Widget = () => null;',

    // A default export declaration carries no id, so there is no name to test for case.
    'export default function (props) { return props.alpha; }',

    // Not assigned to a variable, so the function has no binding name.
    'items.map((props) => props.alpha);',

    // A declarator that destructures the function itself binds no component name.
    'const { length } = function (props) { return props.alpha; };',

    // A dynamic key cannot be destructured, so member-by-member is the only way to spell this.
    'const Widget = (props) => props[key];',
    'const Widget = (props) => { for (const key of keys) { render(props[key]); } return null; };',

    // A JSX member component uses the object itself; `<Icon />` after destructuring renders lowercase.
    'const Widget = (props) => <props.Icon />;',

    // A default value makes the parameter an AssignmentPattern, which is already half a destructure away.
    'const Widget = (props = {}) => props.alpha;',

    // The declarator holds the call's result here, not the component.
    'const Value = (function (props) { return props.alpha; })();',

    // No declarator to read a name from, so the wrapped shape stays out of reach and is declined.
    'export default memo(function (props) { return props.alpha; });',
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
      // A function expression is judged by the const it is assigned to.
      code: 'const Widget = function (props) { return props.alpha + props.bravo; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      // The expression's own lowercase name does not matter; Widget is what the file renders.
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
      // The modern wrapped shape: the component is the argument, the declarator names it.
      code: 'const Widget = memo((props) => props.alpha);',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = forwardRef((props, ref) => <div ref={ref}>{props.alpha}</div>);',
      errors: [{ messageId: 'destructure' }],
    },
    {
      // Wrappers nest, and the declarator still names the component through both.
      code: 'const Widget = memo(forwardRef((props, ref) => <div ref={ref}>{props.alpha}</div>));',
      errors: [{ messageId: 'destructure' }],
    },
  ],
});
