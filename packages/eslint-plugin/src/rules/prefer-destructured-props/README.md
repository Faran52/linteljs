# @linteljs/prefer-destructured-props

Destructure component props in the function signature instead of reading them one field at a time.

- Category: `functions`
- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: no, opt in explicitly

A component that reads `props.alpha` here and `props.bravo` there makes the reader collect its
inputs one member at a time. Destructuring in the signature puts the whole surface on the first
line, where the next reader looks for it.

A function counts as a component when its binding name starts with an uppercase letter: the id of
a declaration, the variable an arrow or function expression is assigned to, or the variable a
call wrapper chain is assigned to, so `const Widget = memo(forwardRef((props, ref) => ...))` is
judged like a bare component. Its first parameter must be a plain identifier, and every reference
to that identifier must be a member read with a destructurable key. One use of the object itself,
anywhere, and the rule stays quiet.

## Examples of incorrect code for this rule

```tsx
// incorrect: every reference is a member read
const Widget = (props) => <div>{props.alpha}{props.bravo}</div>;

// incorrect: a declaration is judged by its own name
function Widget(props) {
  return props.alpha;
}

// incorrect: bracket access is still a member read
const Widget = (props) => props['alpha'];

// incorrect: a function expression is judged by the const it is assigned to
const Widget = function (props) {
  return props.alpha;
};

// incorrect: the declarator names the component through its wrappers
const Widget = memo((props) => props.alpha);
```

## Examples of correct code for this rule

```tsx
// correct: destructured in the signature
const Widget = ({ alpha, bravo }) => <div>{alpha}{bravo}</div>;

// correct: forwarded whole, so the object itself is wanted
const Wrapper = (props) => <input {...props} />;

// correct: passed on as an argument
const Widget = (props) => render(props);

// correct: a lowercase name is a hook or a helper, not a component
const useWidget = (props) => props.alpha;

// correct: one whole-value use beside the member reads
const Widget = (props) => {
  log(props);

  return props.alpha;
};

// correct: a dynamic key cannot be destructured
const Widget = (props) => props[key];

// correct: a member component uses the object itself
const Widget = (props) => <props.Icon />;
```

## Options

None.

## What it declines to report

Any whole-value use of the parameter ends the analysis: a JSX spread, an argument, a return, a
spread into an object, an alias, a reassignment, a computed read with a dynamic key, a JSX member
component. Those need the object itself, and forcing a destructure would only make the component
rebuild what it already had.

An unused props parameter is not reported either; that is `no-unused-vars`' finding. A wrapped
component with no declarator to name it, `export default memo(function (props) {...})`, has no
binding to test for case and is declined rather than guessed at.

## Why there is no autofix

Rewriting the signature means inventing names for every member read, renaming each use, and
carrying any type annotation across. On a `props['alpha']` read there may not even be a legal
identifier to invent. That rewrite belongs to a human.
