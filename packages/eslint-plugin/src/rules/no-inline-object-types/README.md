# @linteljs/no-inline-object-types

Give an object type a name instead of writing its shape inline.

- Applies to: TypeScript only
- Fixable: no
- In `recommended`: yes

An inline shape is a type nothing else can say. It cannot be imported, extended, narrowed by a
guard, or documented above its own declaration, so the second place that needs it either repeats it
or takes a worse type. Naming it costs one line and the name is usually the thing the reader wanted
anyway.

Reports a `TSTypeLiteral` that carries at least one member, wherever it appears: a parameter, a
return annotation, a variable annotation, a generic argument, a property inside an interface, or an
arm of a union or intersection.

## Examples of incorrect code for this rule

```ts
export const read = (answers: { target: string }): string => {
  return answers.target;
};

interface Manifest {
  settings?: { gecko: { id: string } };
}

type Result = { ok: true } | { ok: false };
```

## Examples of correct code for this rule

```ts
interface Answers {
  target: string;
}

export const read = (answers: Answers): string => {
  return answers.target;
};

interface Gecko {
  id: string;
}

interface Manifest {
  settings?: Gecko;
}

interface Succeeded {
  ok: true;
}

interface Failed {
  ok: false;
}

type Result = Succeeded | Failed;
```

## Options

### `allowIn`

Names of generic types whose arguments may be written inline. Defaults to empty, which reports them
like any other shape.

```js
{
  rules: {
    '@linteljs/no-inline-object-types': ['error', { allowIn: ['Extract', 'Exclude'] }],
  },
}
```

The case it exists for is a literal used as a *matcher* rather than as a shape:

```ts
type ObjectPatternNode = Extract<RuleNode, { type: 'ObjectPattern' }>;
```

Nothing there holds data. The literal is a question asked of a union, and naming it produces an
interface whose only use is being passed to `Extract`.

The allowance reaches the argument and no further. A shape nested inside one is still anonymous and
still reported:

```ts
// `{ inner: ... }` is allowed, `{ id: string }` is not.
type Wrapped = Extract<Node, { inner: { id: string } }>;
```

A union written as the argument is the argument, so neither arm is allowed:

```ts
// both arms are reported
type Either = Extract<Node, { a: 'x' } | { b: 'y' }>;
```

A qualified name is matched by its last segment, so `allowIn: ['PropsWithChildren']` allows
`React.PropsWithChildren<{ a: string }>`. The qualifier itself is not matched: `allowIn: ['React']` allows
nothing there.

It is per generic, so `allowIn: ['Extract']` says nothing about `Exclude`.

It matches the name as written, not the type it resolves to. A locally declared `Extract` inherits
the allowance:

```ts
type Extract<T, U> = T;
export type X = Extract<string, { a: string }>;  // allowed, and probably not what you meant
```

Resolving the name would need type information, which this rule does not ask for. Keep the list
short and made of names nobody in the project redeclares.

## What it leaves alone

**The named declaration itself.** `type Answers = { target: string }` is the thing the rule is
asking for, so the literal directly under a type alias is left alone. A literal *nested* inside one
is not: the alias names the outer shape, and the inner one is still anonymous.

**An empty literal.** `{}` has nothing in it to name, and `string & {}` is the idiom that keeps a
union of string literals open to any other string while an editor still offers the named ones.

**A mapped type.** `{ [K in keyof T]: boolean }` is a different node and is not this rule's
business, though a shape written inside one is reported. An index signature is not exempt: it is a
member like any other, so `nested: { [key: string]: string }` is reported.

## Why there is no autofix

Extracting the shape needs a name and a place to put it, and both are
decisions a fixer would have to invent; a generated `Type1` beside the code is worse than the
inline shape it replaced.
