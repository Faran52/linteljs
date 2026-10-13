---
paths:
  - "packages/create/templates/**/*"
---

# Authoring templates: every file once

Each template file is written once, under the one role that owns it:

- `shared/`: framework-neutral files (tokens, theme.css, base.css, i18n keys, TEST_IDS, plain logic).
- `kit/<fw>`: the design system of one framework, shipped whole; it branches on styling and testing only.
- `bindings/<fw>`: framework logic that depends on an answer but not on the host (form and data library bindings),
  taken by that framework's shells and by astro and wxt islands of it.
- `app/<fw>`: app code the shells of one framework share.
- `shells/<shell>`: route files, entry, config and dialect files of one shell.

A shell's `share.json` lists the layers it takes (`layers`) and where each root lands (`place`): its paths, casing and
test suffix. Placement renames files and rewrites their imports, so a file never needs a copy to land at another
path or in another case.

Never add a byte copy of a file another role already holds. When some shells need a file and others do not, put it
in a fact folder (`platform/`, `pageKind/`, `framework/`) or an answer folder inside the layer, not a copy in each
shell. A file that differs only by accident merges into one; a true dialect stays with its shell.
