# @linteljs/sort-hook-dependencies

Keep hook dependency arrays in a consistent order.

- Category: `ordering`
- Applies to: JavaScript and TypeScript
- Fixable: yes (code)
- In `recommended`: no, opt in explicitly

A consistent order makes a diff that adds or drops a dependency readable at a glance. Without one,
the array gets appended to and the reader has to compare two unsorted lists to see what changed.

## Examples of incorrect code for this rule

```ts
// incorrect: bravo before alpha
useEffect(() => {}, [bravo, alpha]);

// incorrect: the last argument is the dependency array, whatever the hook
useCallback(() => {}, [charlie, alpha, bravo]);

// incorrect: sorting is natural, so item2 belongs before item10
useMemo(() => value, [item10, item2]);
```

```ts
/* eslint @linteljs/sort-hook-dependencies: ["error", { "order": "desc" }] */

// incorrect under order: "desc", where the same array is the wrong way round
useEffect(() => {}, [alpha, bravo]);
```

```ts
/* eslint @linteljs/sort-hook-dependencies: ["error", { "hooks": ["useDeepCompareEffect"] }] */

// incorrect once the hook is named in the hooks option
useDeepCompareEffect(() => {}, [bravo, alpha]);
```

## Examples of correct code for this rule

```ts
// correct: sorted
useEffect(() => {}, [alpha, bravo]);

// correct: natural order, so item2 comes before item10
useMemo(() => value, [item2, item10]);

// correct: an element that is not a plain identifier, so the array is left alone
useCallback(() => {}, [props.b, a]);

// correct: a spread, likewise left alone
useEffect(() => {}, [...spread, alpha]);

// correct: a member callee is not checked
React.useEffect(() => {}, [bravo, alpha]);

// correct: not one of the hooks in the list
useSomethingElse(() => {}, [bravo, alpha]);
```

## Options

```jsonc
{
  "@linteljs/sort-hook-dependencies": ["error", {
    "order": "asc",
    "hooks": ["useEffect", "useCallback", "useMemo"]
  }]
}
```

- `order`: `"asc"` or `"desc"`, `"asc"` by default.
- `hooks`: array of strings, at least one, no duplicates. Defaults to
  `["useEffect", "useCallback", "useMemo"]`. These are the call names to check, matched exactly.
  Setting it replaces the defaults rather than adding to them, so list every hook you want checked.

## What it declines to fix

An array is only touched when every element is a plain identifier. A member expression, a call or a
spread means the rule leaves it alone entirely: it does not report and it does not reorder, because
moving text it cannot verify is free of side effects is not worth the risk.

A comment inside the array is reported without a fix. Rewriting the array from the sorted names
alone would drop the comment, and the hand-written line breaks with it.

## Framework independence

This rule matches on the call name only. It does not import React, does not require it as a
dependency, and does not inspect what the callee resolves to. The defaults are the React names
because Preact and Solid use them verbatim, but nothing about the rule is React-specific.

Point it at whatever your project actually calls:

```jsonc
{
  "@linteljs/sort-hook-dependencies": ["error", {
    "hooks": [
      "useEffect",
      "useCallback",
      "useMemo",
      "useDeepCompareEffect",
      "useIsomorphicLayoutEffect"
    ]
  }]
}
```

A member callee such as `React.useEffect` is not checked, because the name before the dot could be
anything.
