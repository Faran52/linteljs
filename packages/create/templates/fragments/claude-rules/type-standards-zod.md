---
paths:
  - "src/lib/apis/**/*.ts"
  - "**/schemas.ts"
---

# Schema Standards

Load alongside `type-standards.md` when touching anything under `src/lib/apis/`.

## Layout

```
lib/apis/
  shared/
    api.ts              base client
    schemas.ts          error and envelope shapes
    entity-schemas.ts   reusable entity shapes
    fields.ts           reusable field primitives
    validations.ts      message builders
  <domain>/<entity>/
    api.ts              the endpoint objects, with typed error variants
    schemas.ts          request and response schemas, one pair per endpoint
    index.ts            export * from './api'
```

`apis/` is the only place that knows about HTTP. `services/` holds domain logic and may never
import from it in the other direction.

## Request and response are separate schemas

Never one schema for both directions. Split any dual-use schema by role, building each from what
that role actually uses rather than cloning the other.

- Request optionality comes from the API contract: a required field that may be blank sends an
  empty string; an optional field that is blank is omitted from the payload entirely.
- A response schema wraps every field in a null-safety helper, because a backend may return
  `null` where its documentation says string. The helper absorbs it and emits a clean type, so no
  null leaks into consumers and nothing downstream needs `?? ''` or `?? []`.

## Wire purity

- Schemas mirror wire field **names**, request and response alike. A transform may only camelCase
  a non-camel wire key. No frontend-invented aliases, no `camelCase` → `camelCase` renames.
- Cross-field resolution and display naming live in selectors and components, never in the schema.
  A schema that renames a field to read better has made itself the second source of truth for what
  the endpoint returns.
- Defaults go on the wire field they belong to.

## Inferred types

- A draft being edited uses `z.input`; parsed, submitted or stored data uses `z.infer` /
  `z.output`. Using the output type for a draft makes every optional-with-default field look
  required while the user is still typing.
- Never hand-write an interface that mirrors a schema. Derive it.

## Anti-patterns

- `x ?? undefined`, a null-to-undefined no-op. The response schema owns the type; read it.
- `Schema.default(() => Schema.parse({}))`, a circular self-default. Use `.default({})`, or let
  the parent `parse` apply the field default.
- `.loose()` / `.passthrough()` on a response schema. An unlisted field is a schema that is out of
  date, not a field to wave through.
- Resolving a nullable key for display with `?? ''`. Resolve it to its label through the entity it
  names. `?? ''` is for a genuinely optional response field, nothing else.
