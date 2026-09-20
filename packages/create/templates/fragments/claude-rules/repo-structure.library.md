---
paths:
  - "src/**/*.ts"
  - "tsconfig.json"
  - "package.json"
---

*The standard for a package that is imported rather than run. The nine per-target files describe
applications; this one describes a library, and this workspace's own copy lives under .claude/rules/*.

# Repository Structure

Use this rule when adding, moving, renaming, or importing a source file in a library.

Filename case and folder case are enforced by `check-file` in `eslint.config.js`. They are not
restated here, because a prose copy of a lint rule is the part that rots. This file carries placement
and direction, which no rule can see.

An application organises by screen: `pages/`, `components/`, `routes/`. A library has no screen. It
organises by the direction its data moves, because that direction is the only thing a consumer can
break. Reaching for `components/ui` in a package of emitters is how a layout stops meaning anything.

## Layout

```
src/
  index.ts        the entry point, and a barrel: no implementation
  <ring>/         one directory per layer, named for what the layer is
    <subject>/    one directory per subject, named for the subject
      <name>.ts   named for its single main export
      <name>.test.ts
```

A ring is a layer of the dependency direction below. Most libraries need two or three. Name them for
what they hold, never for a mechanism: `model` and `render` rather than `core` and `helpers`.

## Placement

- **One folder per thing.** A folder exists when it holds more than one file about one subject, and
  it is named for the subject rather than the mechanism. A subject directory with one file in it is
  still correct if a test sits beside it.
- **A file with one export is named for that export.** A file that is a cohesive module is named for
  its topic. `helpers.ts`, `utils.ts`, `assets.ts` and `index.ts` holding an implementation all fail
  this: a plural noun or a bare verb promises data or an action the file does not contain.
- **`index.ts` is a barrel and nothing else.** It re-exports. The moment it holds a function, the
  package has two names for the same thing and neither is searchable.
- **A helper used by one subject lives in that subject's own `utils/`.** It moves up to a shared
  `utils/` the moment a second subject needs it, not before and not after.
- **A constant used by one module lives in that module.** Move it to a sibling `constants.ts` once
  several modules read it, or once it is one data table worth naming. One table in one file beats the
  same literal in four.
- **Types shared across a ring live in that ring.** A type used by one file lives in that file.
- Ambient `.d.ts` files sit in `typings/` outside `src/`, so they are not mistaken for source.

## Direction

Imports run one way, from the outer ring inward. The innermost ring reaches nothing.

- The inner ring holds what the library *is*: its data, its records, its types. No filesystem, no
  process, no network, no terminal.
- The middle ring turns that into whatever the library produces. It may read the inner ring. It stays
  pure, so it can be tested without a fixture directory.
- The outer ring is everything touching the world: disk, argv, environment, a terminal, a socket. It
  may reach anything.

Enforce this with `import-x/no-restricted-paths` in `eslint.config.js`, scoped to source. A test
legitimately arranges across rings, so the zones cover `src/` and not the specs beside it. A direction
that is only a comment is a direction that is already broken somewhere you have not looked.

## Tests

Colocated beside their source, as `testing.standard.md` requires. A library has no `test/` directory.

Two kinds of file sit outside `src/` and each is a stated exception rather than a leftover:

- Shared fixtures and helpers live in `__mocks__/` at package root. They are not tests, and under
  `src/` they would count toward coverage.
- A script shipped as an asset keeps its test beside it, and `package.json` excludes that test from
  the packed tarball so it does not land in a consumer's install.

A test named for what it covers rather than for one source file is correct when what it covers is the
package: a registry checked against a directory listing, or one corpus run through every export.
Splitting that per file would be N copies of one assertion.

## What ships

`package.json` `files` is canonical for what a consumer receives. A file under `src/` that no export
reaches is dead and gets deleted, not ignored. An asset directory ships whole, so a file added there
is a file every consumer downloads: it earns its place or it does not go.
