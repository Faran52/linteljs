import { tsxRuleTester } from '@mocks/ruleTesters';

import { preferDestructuredProps } from './preferDestructuredPropsRule.ts';

tsxRuleTester.run('prefer-destructured-props', preferDestructuredProps, {
  valid: [
    'const Widget = ({ alpha, bravo }) => <i>{alpha + bravo}</i>;',

    'const widget = (props) => <i>{props.alpha}</i>;',
    'function buildWidget(props) { useStore(); return props.alpha; }',
    'const WIDGET_SIZE = (props) => <i>{props.alpha}</i>;',

    'const Widget = (props) => props.alpha;',
    'function Widget(props) { user(props.alpha); return props.bravo; }',
    'function Widget(props) { reuse(); return props.alpha; }',
    'const Memoed = memo(Widget, (props) => props.alpha);',
    'const Widget = wrap((props) => props.alpha);',

    'const Widget = (props) => <input {...props} />;',
    'const Widget = (props) => <i>{render(props)}</i>;',
    'function Widget(props) { return <i>{props}</i>; }',
    'const Widget = (props) => <i>{{ ...props, active: true }}</i>;',
    'const Widget = (props) => { const copy = props; return <i>{copy.alpha}</i>; };',

    'const Widget = (props) => { log(props); return <i>{props.alpha}</i>; };',

    'const Widget = (props) => { props = normalise(props); return <i>{props.alpha}</i>; };',

    'const Widget = (props) => <i>{data[props]}</i>;',

    'const Widget = (props) => <i />;',
    'const Widget = () => <i />;',

    'export default function (props) { return <i>{props.alpha}</i>; }',

    'items.map((props) => <i>{props.alpha}</i>);',

    'const { length } = function (props) { return <i>{props.alpha}</i>; };',

    'const Widget = (props) => <i>{props[key]}</i>;',
    'const Widget = (props) => { for (const key of keys) { render(props[key]); } return <i />; };',

    'const Widget = (props) => <props.Icon />;',

    'const Widget = (props = {}) => <i>{props.alpha}</i>;',

    'const Value = (function (props) { return <i>{props.alpha}</i>; })();',
    'const Value = (function (props) { return <i>{props.alpha}</i>; })(input);',
    'const Value = function (props) { return <i>{props.alpha}</i>; }(input);',

    'function Widget() { return <i />; }',

    'const Widget = (...props) => <i>{props.length}</i>;',
    'const Widget = ({ alpha }, props) => <i>{alpha + props.bravo}</i>;',
    'const Widget = (props) => <i>{props[`alpha`]}</i>;',
    'const Widget = (props: Props) => <i>{props!.alpha}</i>;',
    'const Widget = (props: Props) => <i>{(props as Props).alpha}</i>;',
    'const Widget = (props: Props): typeof props.alpha => <i>{props.alpha}</i>;',
    'class Panel { Render(props) { return <i>{props.alpha}</i>; } }',
    'const registry = { Widget: (props) => <i>{props.alpha}</i> };',
    'Widget = (props) => <i>{props.alpha}</i>;',

    'const Widget = (props) => { props.alpha = 1; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { props.count += 1; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { props.count++; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { delete props.alpha; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { [props.alpha] = pair; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { [...props.rest] = list; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { ({ key: props.alpha } = source); return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { [props.alpha = 1] = pair; return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { for (props.alpha of list); return <i>{props.bravo}</i>; };',
    'const Widget = (props) => { for (props.alpha in source); return <i>{props.bravo}</i>; };',
  ],
  invalid: [
    {
      code: 'const Widget = (props) => { ({ [props.alpha]: local } = source); return <i>{props.bravo}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => { props.alpha.bravo = 1; delete props.c.d; return <i>{props.e}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => { local = props.alpha; return <i>{-props.bravo}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => { const [first = props.alpha] = list; return <i>{first}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => { for (const key of props.alpha); return <i>{props.bravo}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function Widget(props) { return <i>{props.alpha}</i>; }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => <>{props.alpha}</>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function Widget(props) { const [value] = useState(props.alpha); return value; }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function Widget(props) { const store = React.useContext(Store); return store[props.alpha]; }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function Widget(props) { return use(props.data); }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function List(props) { return props.items.map((item) => <li>{item}</li>); }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = function (props) { return <i>{props.alpha + props.bravo}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = function widget(props) { return <i>{props.alpha}</i>; };',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: "const Widget = (props) => <i>{props['alpha']}</i>;",
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => <div>{props.alpha}{props.bravo}</div>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => <i>{props?.alpha}</i>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = observer((props) => <i>{props.alpha}</i>);',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = memo((props) => props.alpha);',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'export default memo(function (props) { return props.alpha; });',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'export default React.memo(function widget(props) { return props.alpha; });',
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
      code: 'const Widget = (props) => <i>{props[0] + props.alpha}</i>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'export default function Widget(props) { return <i>{props.alpha}</i>; }',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'export const Widget = async (props) => <i>{props.alpha}</i>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Outer = (props) => { const Inner = (props) => <b>{props.b}</b>; return <Inner>{props.a}</Inner>; };',
      errors: [{ messageId: 'destructure' }, { messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (props) => <Child value={props.alpha} {...props.rest} />;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'const Widget = (/* incoming */ props) => <i>{props.alpha}</i>;',
      errors: [{ messageId: 'destructure', column: 32 }],
    },
    {
      code: 'const Widget = (props: Props): JSX.Element => <div>{props.alpha}</div>;',
      errors: [{ messageId: 'destructure' }],
    },
    {
      code: 'function Widget<T>(props: Props<T>) { return <i>{props.value}</i>; }',
      errors: [{ messageId: 'destructure' }],
    },
  ],
});
