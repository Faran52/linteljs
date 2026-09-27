---
paths:
  - "src/**/*.{ts,html}"
  - "tsconfig.json"
  - "angular.json"
---

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file.

Filename and folder case are enforced by `check-file` in `eslint.config.js` and are not restated
here, because a prose copy of a lint rule is the part that rots. The reserved `*.component.ts` /
`*.service.ts` family is Angular's own convention, not a rule this config checks. This file carries
placement and direction, which no rule can see.

A spec sits beside the file it tests and takes the same name, so `app.component.ts` is pinned by
`app.component.spec.ts`. That pairing is convention here too, not something the config enforces.

## Layout

```
src/
  app/            routes, and the components bound to them
  config/         constants and env access. Replaces src/environments/
  typings/        ambient .d.ts only
  assets/  styles/
  components/
    ui/           primitives, reusable by nature
    features/     reusable domain features
  lib/
    store/        cross-cutting state
    utils/        pure helpers, no domain type in the signature
    services/     injectable domain logic, may never touch HTTP
    providers/    DI providers and injection tokens
    apis/         endpoint definitions and schemas
```

`src/config/` replaces `src/environments/`. One config home, read through a typed accessor, rather
than a file the build swaps out from under the code.

## Placement

- **Closest to its consumer.** A component used by one route lives in that route's folder under
  `app/`; it moves to `components/` the moment a second route needs it.
- A component reusable by nature belongs in `components/ui/` even with one consumer today. A
  component bound to its parent's data stays in that parent's folder. Never nest a private folder
  inside another.
- **There is no hooks slot; DI is the composition mechanism.** Shared reactive state is an
  `@Injectable` in `lib/services/` provided at the right level, not a function every component
  calls.
- Provide a service at the narrowest scope that works: `providedIn: 'root'` for genuinely global
  state, a route or component `providers` array otherwise. A root-provided service holding one
  route's state is a memory leak with extra steps.
- `services/` is domain logic and may never import from `apis/`. `apis/` is the only layer that
  knows about HTTP, and the only place `HttpClient` is injected.
- Standalone components only. No `NgModule`.

## Direction

Imports run one way: `app → components → store → utils / services / providers → config`.

- `config/*` imports only sibling config, assets, and third-party modules.
- `utils/*`, `services/*` and `providers/*` do not import from `app/`, `components/` or `store/`.
- `components/*` does not import from `app/`.
- One route domain does not import from another. Lift the shared part instead.
- `tsconfig.json` is canonical for path aliases. Use the configured ones; never invent a shorthand
  and never write a `src/` prefix.
