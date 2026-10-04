# @linteljs/no-eslint-disable

Fix what a rule reports, or name the exemption in the config. Do not disable it inline.

- Applies to: JavaScript and TypeScript
- Fixable: no
- In `recommended`: yes

A disable comment is an exemption nobody can find. It sits in the file it excuses, it outlives the
reason it was written for, and no one reviewing the config ever learns it exists. An exemption in
the config is the same decision written where the next person looks for it.

Reports every directive ESLint honours as a disable:

- `// eslint-disable-next-line`
- `// eslint-disable-line`
- `/* eslint-disable */`
- `/* eslint no-console: "off" */`, and the `0` and `["off", ...]` spellings in any case: inline configuration
  that turns a rule off. ESLint 8 and older honour `"OFF"` too. One that turns a rule on or sets its options is not reported.

A description after `--` changes nothing; ESLint honours the directive either way, so the rule
reports it either way.

Prose that opens with the keyword is reported, and that is correct rather than a false positive.
`// eslint-disable is banned` is not a sentence to ESLint: it reads `is` and `banned` as rule names
and fails on the first.

## Examples of incorrect code for this rule

```js
// eslint-disable-next-line no-console
console.log(value);

/* eslint-disable no-console */
```

## Examples of correct code for this rule

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
`// eslint-disable-next-line no-console, no-alert` does not. Inline configuration is held to the same list
by the rules it turns off: `/* eslint no-console: "off" */` passes, and
`/* eslint no-console: "off", no-alert: "off" */` does not.

## What it leaves alone

None of these suppresses an ESLint rule, so none is reported: `eslint-enable`, inline configuration
that leaves every rule on, and another tool's directive such as `prettier-ignore`,
`@ts-expect-error` or `v8 ignore`.

## Why there is no autofix

Deleting the comment is one line to write and a bad line to apply: every
finding it was hiding arrives at once, in a file the author did not open, from a `--fix` they ran
for something else.

## Notes

### What this rule cannot catch

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

### Scoping it to files

There is no option for this, because flat config already does it and does it better: a second block
composes with whatever a shared config set, where a rule option would replace it wholesale.

```js
{ files: ['**/*.gen.ts'], rules: { '@linteljs/no-eslint-disable': 'off' } }
```

A generated file is the usual reason. `routeTree.gen.ts` opens with a bare directive and its
generator rewrites it on every run, so there is nothing to fix in it.
