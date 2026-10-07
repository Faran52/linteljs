---
paths:
  - "src/**/*.{ts,tsx}"
  - "tsconfig.json"
  - "app.json"
---

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file.

Filename case and folder case are enforced by `check-file` in `eslint.config.ts`. They are not
restated here, because a prose copy of a lint rule is the part that rots. This file carries
placement and direction, which no rule can see.

A spec sits beside the file it tests and takes its case: `Mark.test.tsx` beside `Mark.tsx`,
`useExtendedQuery.test.ts` beside `useExtendedQuery.ts`. **Never put a test under `src/app/`**: expo-router
bundles every file there as a route, and a suite breaks the export. A route's suite sits in `src/`, named
for the route with its path flattened: `app-tabs-index.test.tsx` for `src/app/(tabs)/index.tsx`.

## Layout

`src/app/` is Expo Router's, and the router owns it: a file's path there *is* its route, so a file
moved is a route changed. That ownership covers case too, so the filename and the folder convention
admit the router's own spellings there: `_layout.tsx` and segments like `[slug]` and `(tabs)` are
spelled the way the router reads them. Everything a route reaches sits beside it under `src/`.

```
src/
  app/                  routes, owned by expo-router
    _layout.tsx         the providers and a root Stack over the tab group and the 404
    (tabs)/             the tab pages, apart from the 404 so the tab bar counts only tabs
      _layout.tsx       the Tabs navigator
      index.tsx         the entry route
    +not-found.tsx      the 404
  app-<route>.test.tsx  each route's suite, outside the route root
  components/
    ui/                 primitives: text, button, card
    features/           reusable domain features
  config/               constants, the route list and env access
  styles/               shared StyleSheet modules
  hooks/                use* only
  lib/
    store/              universal
    utils/              pure *Utils.ts helpers, no domain type in the signature
    services/           domain logic, may never touch the network directly
    providers/          context providers
    apis/               endpoint definitions and schemas
  typings/              ambient .d.ts only
  config-plugins/       Expo config plugins, one subject each
  i18n/                 the languages and their messages <!-- when languages -->
```

A `.web.tsx` beside a `.tsx` is Expo's platform split. Add one only where the platforms genuinely
diverge, and never to work around a type error on one of them.

`partials/` is a private slot, allowed inside any route or feature folder, never nested.

## Placement

- **A screen is not a component.** `src/app/` holds routes and the wiring that makes them routes;
  what they render belongs in `src/components/` or `src/lib/`. A route file that grows logic is a
  feature waiting to be lifted out of the router.
- **Closest to its consumer.** A helper used by one screen lives in that screen's folder; it moves
  to `src/lib/` on the second consumer, not in anticipation of one.
- **Styles live with the component**, as a `StyleSheet.create` call at the bottom of the file; what
  several screens share sits in `src/styles/`.
