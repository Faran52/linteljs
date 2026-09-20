---
paths:
  - "src/**/*.{ts,tsx}"
  - "tsconfig.json"
  - "vite.config.ts"
---

*Shipped verbatim into generated projects; this workspace's own copy lives under .claude/rules/*.

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file.

Filename case and folder case are enforced by `check-file` in `eslint.config.js`. They are not
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
    store/        cross-cutting state, via createStore from solid-js/store
    utils/        pure helpers, no domain type in the signature
    services/     domain logic, may never touch HTTP
    providers/    context providers
    primitives/   createX, reactive state owners
    apis/         endpoint definitions and schemas
  pages/<kebab>/  {Name}Page.tsx and its private slots
```

On SolidStart the route unit is `src/routes/` instead of `src/pages/`; nothing else moves.

The store is Solid's own: `createStore` from `solid-js/store`, which ships inside `solid-js`. No
store library is installed, so do not add one for state a module in `lib/store/` can already hold.

## Placement

- **Closest to its consumer.** A helper used by one page lives in that page's `utils/`; it moves to
  `lib/utils/` the moment a second page needs it, not before and not after.
- A component reusable by nature belongs in `components/ui/` even with one consumer today. A
  component bound to its parent's data belongs in that parent's `partials/`, and you should be able
  to justify each one in a sentence. Never nest `partials/`.
- **`lib/primitives/`, not `lib/hooks/`, and `createX`, not `useX`.** These are not hooks: a Solid
  component runs once, so there is no hook order and nothing re-runs. Naming them `use*` imports a
  mental model that does not apply and will produce destructured props.
- A function that owns no reactive state is a util, not a primitive. It belongs in `lib/utils/`.
- `services/` is domain logic and may never import from `apis/`. `apis/` is the only layer that
  knows about HTTP.

## Direction

Imports run one way:
`pages → components → store → utils / services / primitives / providers → config`.

- `config/*` imports only sibling config, assets, and third-party modules.
- `utils/*`, `services/*`, `primitives/*` and `providers/*` do not import from `pages/`,
  `components/` or `store/`.
- `store/*` does not import from `pages/` or `components/`.
- `components/*` does not import from `pages/`.
- One page domain does not import from another. Lift the shared part instead.
- `tsconfig.json` is canonical for path aliases. Use the configured ones; never invent a shorthand
  and never write a `src/` prefix.
