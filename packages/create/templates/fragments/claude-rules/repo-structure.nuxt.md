---
paths:
  - "src/**/*.{ts,vue}"
  - "tsconfig.json"
  - "nuxt.config.ts"
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
    store/        cross-cutting state; Pinia stores when Pinia was selected
    utils/        pure *Utils.ts helpers, no domain type in the signature
    services/     domain logic, may never touch HTTP
    providers/    provide/inject wrappers
    composables/  cross-cutting composables
    apis/         endpoint definitions and schemas
  views/<kebab>/  {Name}View.vue, one per route, and its private slots
  pages/          the routes themselves, one file per route
  app.vue  error.vue  the shell and the error page
  plugins/        the i18n plugin <!-- when languages -->
  i18n/           the languages and their messages <!-- when languages -->
```

`pages/` is Nuxt's, and its filenames are the URL: `pages/about.vue` is `/about` and
`pages/index.vue` is `/`. A page file names a view and nothing else, so the page written in
`views/about/AboutView.vue` is testable without a router and the route file stays one line. There
is no `router/`: the directory is the route table.

`app.vue` is the shell every route renders inside. It carries what is mounted once, which is the
header, and `<NuxtPage />` is where the route goes.

`nuxt.config.ts` is canonical for the build, and this project sets two things there that matter.
`srcDir` is `src/`, not Nuxt 4's default `app/`, so every glob in the project reads one source root.
`alias` carries the path aliases, because `tsconfig.json` extends `.nuxt/tsconfig.app.json` and a
`paths` of its own would replace the set Nuxt generates from them.

`.nuxt/` and `.output/` are generated. Never edit either, and never commit a fix into one.

Where Pinia was selected, its stores live in `lib/store/`, not the conventional `src/stores/`. One
`lib/` spine is worth more than matching a default that exists only because the scaffolder had
nowhere else to put it.

## Placement

- **Closest to its consumer.** A helper used by one view lives in that view's `utils/`; it moves to
  `lib/utils/` the moment a second view needs it, not before and not after.
- A component reusable by nature belongs in `components/ui/` even with one consumer today. A
  component bound to its parent's data belongs in that parent's `partials/`, and you should be able
  to justify each one in a sentence. Never nest `partials/`.
- A `views/` component is the route's entry and nothing else: it wires data to components. Logic in
  a view is logic that cannot be tested without a router.
- A composable owns reactive state and returns refs. A function that takes plain values and returns
  a plain value is a util, not a composable, and belongs in `lib/utils/`.
- `services/` is domain logic and may never import from `apis/`. `apis/` is the only layer that
  knows about HTTP.

## Direction

Imports run one way:
`views → components → store → utils / services / composables / providers → config`.

- `config/*` imports only sibling config, assets, and third-party modules.
- `utils/*`, `services/*`, `composables/*` and `providers/*` do not import from `views/`,
  `components/` or `store/`.
- `store/*` does not import from `views/` or `components/`.
- `components/*` does not import from `views/`.
- `pages/*` imports views and nothing else.
- `alias` in `nuxt.config.ts` is canonical for path aliases. Use the configured ones; never invent
  a shorthand and never write a `src/` prefix.
