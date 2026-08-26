*Shipped verbatim into generated projects.*

## Relaxed type safety

This project was generated with `typeSafety: relaxed`, and where this section contradicts the
Types section above, this section wins. `scripts/checkBannedPatterns.ts` carries the same choice as
a constant, so the two agree by construction.

What is still banned, because a compiler cannot catch either one:

- **No double casts.** `as unknown as X` erases the type on the way through, so tsc has nothing
  left to reject and the assertion always succeeds. That is the one cast that is never a narrowing.
- **No `eslint-disable`.** Turning a rule off is not a type decision, and the rule stays off long
  after the line that needed it has gone.

What is allowed here that the strict floor bans:

- `unknown`, anywhere, not only as a narrowing guard's input.
- A single `as X`. tsc rejects casts between non-overlapping types on its own; a cast that
  compiles is one it has already checked.
- `as never`, `@ts-ignore` and `@ts-expect-error`. Each is visible in review and in a diff.
- `Partial<T>`, index signatures, and `Record<string, unknown>`.

Prefer the named shapes in `src/typings/customTypes.d.ts` over spelling them out, so a reader sees
the intent rather than the primitive:

- `CustomTypes.JsonObject` and `CustomTypes.JsonValue` for a parsed payload of unknown shape.
- `CustomTypes.GenericFunction` for a callback whose signature the call site does not own.

Everything else in this file still applies. The carve-outs above are for the boundaries a type
cannot reach, not a licence to skip typing what you own: a shape you control still gets a named
`interface`, and a derived shape still comes from its owner.
