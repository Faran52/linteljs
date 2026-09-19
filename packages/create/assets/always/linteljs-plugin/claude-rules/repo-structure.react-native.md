---
paths:
  - "src/**/*.{ts,tsx}"
  - "tsconfig.json"
  - "app.json"
---

*Shipped verbatim into generated projects; this workspace's own copy lives under .claude/rules/*.

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file.

Filename case and folder case are enforced by `check-file` in `eslint.config.js`. They are not
restated here, because a prose copy of a lint rule is the part that rots. This file carries
placement and direction, which no rule can see.

A spec sits beside the file it tests and takes its case: `ThemedText.test.tsx` beside
`ThemedText.tsx`, `useTheme.test.ts` beside `useTheme.ts`. Under `src/app/` it takes the route
file's name instead, `_layout.test.tsx` included, because that name is the router's.

## Layout

`src/app/` is Expo Router's, and the router owns it: a file's path there *is* its route, so a file
moved is a route changed. That ownership covers case too, so the directory is exempt from both the
filename and the folder convention: `_layout.tsx`, `explore.tsx` and segments like `[slug]` and
`(tabs)` are spelled the way the router reads them. Everything a route reaches sits beside it
under `src/`.

```
src/
  app/                  routes, owned by expo-router
    _layout.tsx         the shell every route below renders inside
    index.tsx           the entry route
  components/
    ui/                 primitives: text, button, card
    features/           reusable domain features
  constants/            theme and shared values
  hooks/                use* only
  lib/
    store/              universal
    utils/              pure helpers, no domain type in the signature
    services/           domain logic, may never touch the network directly
    providers/          context providers
    apis/               endpoint definitions and schemas
  typings/              ambient .d.ts only
```

A `.web.tsx` beside a `.tsx` is Expo's platform split and is already in the template. Add one only
where the platforms genuinely diverge, and never to work around a type error on one of them.

`partials/` is a private slot, allowed inside any route or feature folder, never nested.

## Placement

- **A screen is not a component.** `src/app/` holds routes and the wiring that makes them routes;
  what they render belongs in `src/components/` or `src/lib/`. A route file that grows logic is a
  feature waiting to be lifted out of the router.
- **Closest to its consumer.** A helper used by one screen lives in that screen's folder; it moves
  to `src/lib/` on the second consumer, not in anticipation of one.
- **Styles live with the component**, as a `StyleSheet.create` call at the bottom of the file. The
  template also ships `src/global.css` and `AnimatedIcon.module.css`, so `lint:css` is a real gate
  here rather than an empty glob.
