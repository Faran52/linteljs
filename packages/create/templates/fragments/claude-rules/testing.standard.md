## Standard

- **Zero casts, including in tests.** No `as X`, `as unknown as X`, `as never`. Build a fixture the
  real types already satisfy: a schema's `parse`, a real store seeded by dispatching the producing
  action, `document.createElement(...)` for elements, `new Response(...)` for fetch. A type you can
  only satisfy with a cast means the test design is wrong, usually a stub standing where the real
  thing should be.
- **Behaviour and integration only.** Assert what a user or assistive technology observes: text,
  roles, labels, attributes, what appears and disappears. Never assert on a hashed CSS Module class
  name, and never on internal state. If the only difference a prop makes is a class name, there is
  nothing to test, say so and skip it.
- **State that matters must be observable.** If a state change shows up only as a hashed class, the
  fix is to expose it (`data-open={open}`), not to assert on the class and not to skip the branch.
- **Mock only external boundaries.** Libraries, network, timers, platform APIs. Never mock a module
  you own to make an assertion easier; that turns the test into a mirror of the implementation.
- **No jest-dom matchers.** `screen.getByX()` for presence, `queryByX(...) === null` for absence,
  typed element values for form state.
- **No comments.** The test name says what it pins.
- **No redundancy.** If two tests fail for the same edit, keep one.
- **One test file per source file**, colocated, mirroring any split of the source.
- **A test that cannot fail is not a test.** Break the code, watch it go red, then revert. Never
  leave the mutation in the tree.
- **Coverage: 100% line and branch** of the source you touched, reached with behaviour tests rather
  than contrived ones.
- **A type-level guard that cannot fire at runtime** gets `// v8 ignore next N -- reason`, with the
  reason stated. That is for a branch the compiler demands and reality cannot reach, such as a ref
  that is always set before effects run. It is not a way to skip a branch you did not want to test.
