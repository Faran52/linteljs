# @linteljs/prefer-destructured-props

Destructure component props in the function signature instead of reading them one field at a time.

- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

A component that reads `props.alpha` here and `props.bravo` there makes the reader collect its
inputs one member at a time. Destructuring in the signature puts the whole surface on the first
line, where the next reader looks for it.

A function counts as a component when its binding name is PascalCase and its body holds JSX or a
hook call (`use` or `use*`, bare or as a member such as `React.useState`), or when it is the first
argument of `memo` or `forwardRef`, whatever its name. The binding name is the id of a declaration,
the variable an arrow or function expression is assigned to, or the variable a call wrapper chain
is assigned to, so `const Widget = observer((props) => <div />)` is judged like a bare component.
JSX in a nested callback, such as a `map` over items, counts for the enclosing function. Its first
parameter must be a plain identifier, and every reference
to that identifier must be a member read with a destructurable key. One use of the object itself,
anywhere, and the rule stays quiet.

## Examples of incorrect code for this rule

```tsx
// incorrect: every reference is a member read
const Widget = (props) => <div>{props.alpha}{props.bravo}</div>;

// incorrect: a declaration is judged by its own name, and a hook call marks a component
function Widget(props) {
  const [value] = useState(props.alpha);

  return value;
}

// incorrect: bracket access is still a member read
const Widget = (props) => <div>{props['alpha']}</div>;

// incorrect: a function expression is judged by the const it is assigned to
const Widget = function (props) {
  return <div>{props.alpha}</div>;
};

// incorrect: a memo or forwardRef callback is a component whatever its name
export default memo(function (props) {
  return props.alpha;
});
```

## Examples of correct code for this rule

```tsx
// correct: destructured in the signature
const Widget = ({ alpha, bravo }) => <div>{alpha}{bravo}</div>;

// correct: forwarded whole, so the object itself is wanted
const Wrapper = (props) => <input {...props} />;

// correct: passed on as an argument
const Widget = (props) => <div>{render(props)}</div>;

// correct: a lowercase name is a hook or a helper, not a component
const useWidget = (props) => useStore(props.alpha);

// correct: no JSX and no hook call, so not a component
const Widget = (props) => props.alpha;

// correct: one whole-value use beside the member reads
const Widget = (props) => {
  log(props);

  return <div>{props.alpha}</div>;
};

// correct: a dynamic key cannot be destructured
const Widget = (props) => <div>{props[key]}</div>;

// correct: a member component uses the object itself
const Widget = (props) => <props.Icon />;

// correct: a write through the object cannot go through a destructured copy
const Widget = (props) => {
  props.count++;

  return <div>{props.alpha}</div>;
};
```

## Options

None.

## What it leaves alone

Any whole-value use of the parameter ends the analysis: a JSX spread, an argument, a return, a
spread into an object, an alias, a reassignment, a computed read with a dynamic key, a JSX member
component. Those need the object itself, and forcing a destructure would only make the component
rebuild what it already had.

A write through the parameter, anywhere, ends it too: `props.alpha = 1`, `props.count += 1`,
`props.count++`, `delete props.alpha`, or a member as a destructuring or `for...of` target. Each
changes the object, and a destructured local would take the write in its place.

An unused props parameter is not reported either; that is `no-unused-vars`' finding.

## Why there is no autofix

Rewriting the signature means inventing names for every member read, renaming each use, and
carrying any type annotation across. On a `props['aria-label']` read there is not even a legal
identifier to invent. That rewrite belongs to a human.
