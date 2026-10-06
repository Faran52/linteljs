---
paths:
  - "src/**/*.{ts,svelte}"
  - "tsconfig.json"
  - "vite.config.ts"
---

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file.

Filename case and folder case are enforced by `check-file` in `eslint.config.ts`. They are not
restated here, because a prose copy of a lint rule is the part that rots. This file carries placement and
direction, which no rule can see.

A spec takes the name of the file it tests, whatever case that is. The naming rule deliberately
carries no glob for a spec: it mirrors a subject that is already policed, and a `.ts` spec of a
component judged by the rule meant for a module could satisfy neither. Match the file you are
testing.

## Layout

```
src/
  config/         constants and env access
  typings/        ambient .d.ts only
  assets/  styles/
  components/
    ui/           primitives, reusable by nature
    features/     reusable domain features
  lib/
    store/        cross-cutting state, as $state runes in .svelte.ts modules
    utils/        pure *Utils.ts helpers, no domain type in the signature
    services/     domain logic, may never touch HTTP
    providers/    context wrappers
    hooks/        cross-cutting hooks
    apis/         endpoint definitions and schemas
  routes/         the router. Reserved filenames only
  params/         param matchers
  hooks.server.ts  hooks.client.ts
```

Components stay at `src/components/`, not `src/lib/components/`. `#lib` already points at
`src/lib`, and SvelteKit's reserved `src/hooks.server.ts` sits at the `src/` root, so neither
clashes with `lib/hooks/`.

The store is Svelte's own unless this project answered otherwise: a `$state` rune exported from a
`.svelte.ts` module in `lib/store/`, with `svelte/store` only where a library's contract demands
one. Whichever is there, it is the only file that knows which, and every reader takes the hook it
exports. Do not add a second library for state a rune already holds. Mind the server:
`svelte-reactivity.md` covers why module-level state on the server is a cross-user leak.

## Placement

- **Closest to its consumer.** A component used by one route lives in that route folder as a
  private partial; it moves to `components/` the moment a second route needs it.
- Everything in a `routes/` folder that is not a reserved filename is private to that route. Never
  nest a private folder inside another.
- A component reusable by nature belongs in `components/ui/` even with one consumer today.
- `+page.server.ts` and `+server.ts` are the only place server secrets appear. Everything they need
  comes from `$app/env/private`, never from a module also imported by a `.svelte` file.
- A `load` function orchestrates; it does not hold logic. Put the logic in `services/` and test it
  without a request.
- `services/` is domain logic and may never import from `apis/`. `apis/` is the only layer that
  knows about HTTP.

## Direction

Imports run one way: `routes → components → store → utils / services / hooks / providers → config`.

- `config/*` imports only sibling config, assets, and third-party modules.
- `utils/*`, `services/*`, `hooks/*` and `providers/*` do not import from `routes/`, `components/`
  or `store/`.
- `components/*` does not import from `routes/`.
- One route domain does not import from another. Lift the shared part instead.
- Never put mutable module-level state in anything the server imports: SvelteKit shares the module
  across requests, so it becomes a cross-user leak. Per-request state goes in `event.locals` or a
  context set during rendering.
- `tsconfig.json` is canonical for path aliases, and `package.json` `imports` for `#lib`, which names
  the file with its extension. Never invent a shorthand and never write a `src/` prefix.
