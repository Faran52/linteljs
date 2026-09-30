# @linteljs/no-eslint-disable

Fix what a rule reports, or name the exemption in the config. Do not disable it inline.

- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: yes

A disable comment is an exemption nobody can find. It sits in the file it excuses, it outlives the
reason it was written for, and no one reviewing the config ever learns it exists. An exemption in
the config is the same decision written where the next person looks for it.

## Rule details

Reports every directive ESLint honours as a disable:

- `// eslint-disable-next-line`
- `// eslint-disable-line`
- `/* eslint-disable */`
- `/* eslint no-console: "off" */`, and the `0` and `["off", ...]` spellings: inline configuration that turns
  a rule off. One that turns a rule on or sets its options is not reported.

A description after `--` changes nothing; ESLint honours the directive either way, so the rule
reports it either way.

Not reported, because none of them suppresses an ESLint rule: `eslint-enable`, inline configuration
that leaves every rule on, and another tool's directive such as `prettier-ignore`,
`@ts-expect-error` or `v8 ignore`.

Prose that opens with the keyword is reported, and that is correct rather than a false positive.
`// eslint-disable is banned` is not a sentence to ESLint: it reads `is` and `banned` as rule names
and fails on the first.

Report-only, with no fix. Deleting the comment is one line to write and a bad line to apply: every
finding it was hiding arrives at once, in a file the author did not open, from a `--fix` they ran
for something else.

## What this rule cannot catch

Two directives disable this rule itself, before it runs:

```js
/* eslint-disable */
// eslint-disable-next-line @linteljs/no-eslint-disable
```

No rule can report those, because ESLint has already switched it off by the time the traversal
starts. The complement is a linter option rather than a rule:

```js
export default [
  { linterOptions: { noInlineConfig: true } },
];
```

Under `noInlineConfig` every directive is inert, so nothing can be suppressed and each comment is
reported as having no effect. That report is a warning, so `--max-warnings 0` is what turns it into
a failure. The two work together: the rule gives the error, the option removes the escape hatch from
the escape hatch.

## Examples

Incorrect:

```js
// eslint-disable-next-line no-console
console.log(value);

/* eslint-disable no-console */
```

Correct:

```js
// The finding is fixed.
logger.info(value);
```

```js
// Or the exemption is named where the next person will find it.
export default [
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
];
```

## Options

### `allowRules`

Rule ids a directive may name. Defaults to empty, which reports every directive.

A directive is allowed only when **every** rule it names is on the list, because one naming an
allowed rule beside a forbidden one suppresses both. A bare directive names nothing and is never
allowed: it is the form that turns the whole file off.

```js
{
  rules: {
    '@linteljs/no-eslint-disable': ['error', { allowRules: ['no-console'] }],
  },
}
```

With that, `// eslint-disable-next-line no-console` passes and
`// eslint-disable-next-line no-console, no-alert` does not.

## Scoping it to files

There is no option for this, because flat config already does it and does it better: a second block
composes with whatever a shared config set, where a rule option would replace it wholesale.

```js
{ files: ['**/*.gen.ts'], rules: { '@linteljs/no-eslint-disable': 'off' } }
```

A generated file is the usual reason. `routeTree.gen.ts` opens with a bare directive and its
generator rewrites it on every run, so there is nothing to fix in it.
