---
paths:
  - "src/**/*.ts"
  - "tsconfig.json"
  - "vite.config.ts"
  - "manifest.json"
---

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

A generated project has `manifest.json` and the folders for the surfaces it was generated with.
The popup is `index.html`, with `src/main.ts` rendering `src/popup/` and its mark from `src/lib/mark/`. <!-- when popup -->
`src/background/` holds the service worker. <!-- when background -->
`devtools.html` loads `src/devtools/`, and `panel.html` loads `src/panel/`. <!-- when devtools-panel -->
The rest of the tree below is where the next surface goes. Do not keep a folder for a surface this project
does not have.

**`manifest.json` is the entry point in both senses.** `@crxjs/vite-plugin` reads it to decide
what to build, and the browser reads it to decide what to load. A surface that is not declared
there does not exist, however complete its code is, and adding one means adding it there first.
Permissions are the project's own security surface: add one when a feature needs it, not ahead of
one.

```
manifest.json     at the repo root, declares every surface below
index.html        the popup, referenced as action.default_popup
devtools.html     the devtools page, referenced as devtools_page
panel.html        the panel it opens, a vite input: the manifest cannot name it
src/
  main.ts         the popup entry, rendering popup/
  style.css       the stylesheet entry, importing styles/ and lib/mark/
  popup/          what the popup renders
  background/     the service worker named by manifest.background
  content-scripts/
  devtools/  panel/
  config/         constants and env access
  typings/        ambient .d.ts only
  assets/  styles/
  components/
    ui/           primitives: DOM-building modules or custom elements
    features/     reusable domain features
  lib/
    mark/         the popup's mark, a string of markup and its stylesheet
    model/        domain entities and their types
    utils/        pure *Utils.ts helpers, no domain type in the signature
    services/     domain logic, may never touch the platform
    apis/         endpoint definitions and schemas
```

Entry HTML stays flat at the repo root: the browser resolves `devtools_page` and panel pages
against the extension root, so a `src/` path in the manifest means shipping a build step whose only
job is undoing it.

## Placement

- **Closest to its consumer.** A helper used by one surface lives in that surface's folder; it moves
  to `lib/utils/` the moment a second surface needs it, not before and not after.
- **`lib/` is the framework-free, platform-free core.** No `chrome.*`, no `document`, no
  `import.meta.env`. That is what makes it testable without a browser and reusable across surfaces
  that do not share a realm.
- `src/extension`-facing code (anything touching `chrome.*` or `browser.*`) stays in the surface
  folders. One adapter per surface, not a platform call scattered through `lib/`.
- A component here is a DOM-building module or a custom element. `components/ui/` takes anything
  reusable by nature even with one consumer today; a component bound to its parent's data lives in
  that parent's `partials/`, never nested.
- `lib/model/` holds domain entities and their types. `lib/services/` holds the logic over them.
- Anything shared between a content script and the background worker is a **message contract**, not
  an import: the two never share a realm. Type the message in `lib/model/` and let each side import
  the type only.
- **`workers/` is for a Web Worker, and only for one.** A worker is a fourth realm beside the
  background, the content script and the page, so it belongs beside the surfaces rather than under
  `lib/`: it has its own entry, its own bundle and its own message contract. The rule above still
  holds inside it, which is that the work itself lives in `lib/` and the file in `workers/` is the
  adapter that receives a message and calls it. A background worker is not this; that is
  `background/`, which the manifest names.

## Direction

Imports run one way: `surfaces → components → lib/services → lib/model / lib/utils → config`.

- `config/*` imports only sibling config, assets, and third-party modules.
- `lib/*` does not import from a surface folder or from `components/`.
- `components/*` does not import from a surface folder.
- One surface does not import from another.
- `tsconfig.json` is canonical for path aliases. Use the configured ones; never invent a shorthand
  and never write a `src/` prefix.
