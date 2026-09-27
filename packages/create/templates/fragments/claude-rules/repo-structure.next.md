---
paths:
  - "src/**/*.{ts,tsx}"
  - "tsconfig.json"
  - "next.config.ts"
---

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file.

Filename case, folder case and the App Router's reserved filenames are enforced by `check-file` in
`eslint.config.js`. They are not restated here, because a prose copy of a lint rule is the part that
rots. This file carries placement and direction, which no rule can see.

A spec takes the name of the file it tests, whatever case that is. The naming rule deliberately
carries no glob for a spec: it mirrors a subject that is already policed, and a `.ts` spec of a
component judged by the rule meant for a module could satisfy neither. Match the file you are
testing.

## Layout

```
src/
  app/            routes, layouts and route handlers. The only router
    api/          route handlers
  config/         constants and env access
  typings/        ambient .d.ts only
  content/        static data
  assets/  styles/
  components/
    ui/           primitives, reusable by nature
    features/     reusable domain features
  lib/
    store/        cross-cutting client state
    utils/        pure helpers, no domain type in the signature
    services/     domain logic, may never touch HTTP
    providers/    context providers
    hooks/        cross-cutting hooks
    server/       server-only modules
    apis/         endpoint definitions and schemas
```

There is no `src/pages/`. One router, and it is `app/`.

## Placement

- **Closest to its consumer.** A helper used by one route lives beside it in that route folder; it
  moves to `lib/utils/` the moment a second route needs it, not before and not after.
- A route folder holds its reserved files and a private `partials/` for components bound to that
  route's data. Anything reusable moves to `components/`. Never nest `partials/`.
- A component reusable by nature belongs in `components/ui/` even with one consumer today.
- `lib/server/` is for modules that import `server-only`: database access, secrets, anything that
  must never reach the client bundle. A Client Component importing from it is a build error, which
  is the point.
- `lib/utils/` takes a helper with no domain type in its signature. Anything with a domain type in
  it is a service.
- `services/` is domain logic and may never import from `apis/`. `apis/` is the only layer that
  knows about HTTP.
- Static text and data go in `content/`, typed, not inlined in a component.

## Direction

Imports run one way: `app → components → store → utils / services / hooks / providers → config`.

- `config/*` imports only sibling config, assets, and third-party modules.
- `utils/*`, `services/*`, `hooks/*` and `providers/*` do not import from `app/`, `components/` or
  `store/`.
- `components/*` does not import from `app/`.
- One route domain does not import from another. Lift the shared part instead.
- `'use client'` marks a boundary, not a file type. Push it as far down the tree as it will go: a
  layout marked client makes everything under it client.
- `tsconfig.json` is canonical for path aliases. Use the configured ones; never invent a shorthand
  and never write a `src/` prefix.
