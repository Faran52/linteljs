---
paths:
  - "**/*.{test,spec}.{ts,tsx}"
  - "__mocks__/**/*"
  - "jest.config.js"
---

# Testing Rules

Use these rules when touching tests, mocks, or test setup.

## Infrastructure

- **Jest, through `jest-expo`'s default preset.** It is the runner Expo ships and tests against.
  Babel compiles every suite to CommonJS, so a top-level `await` cannot run: reach a module through
  `jest.requireActual` or a plain `import`, and keep a `jest.mock` factory synchronous.
- **One project, the native one.** The preset resolves as iOS. A branch on the platform is reached
  by replacing the value it reads, `jest.replaceProperty(Platform, 'OS', 'web')`, not by a second
  run. Should a module gain a `.web` variant, it needs a second project whose resolver prefers the
  `.web` sibling, or that variant stays at 0%.
- React Native Testing Library. Query by what a user or a screen reader reaches: `getByRole`,
  `getByLabelText`, `getByText`. Never by `testID` where a role or a label exists.
- Test globals are available without import. Do not mix bare and imported styles in one file.
- `__mocks__/setupTests.tsx` is the run's `setupFilesAfterEnv`, wired from `jest.config.js`. It carries
  the stand-ins for the native modules the template imports: nothing native runs under a unit
  test, so each of those throws at import time rather than returning something wrong.
- Coverage is 100% on statements, branches, functions and lines, the same bar every other target
  carries. `jest.config.js` holds the thresholds; never lower one to make a run pass.

## Mocking the platform

Four things about mocking `react-native` that cost real time to find. They are rules rather than
notes: each one is the difference between a test that runs and one that dies at import.

- **Never spread `react-native`.** `{ ...actual }` reads every property, and that module's exports
  are lazy getters whose initialisers fail an invariant outside a native runtime, so the spread
  throws before your first assertion. Wrap it in a `Proxy` and answer the one key you are replacing:

  ```ts
  return new Proxy(actual, {
    get: (target, key): unknown => {
      return key === 'Platform' ? platform : Reflect.get(target, key);
    },
  });
  ```

- **Mock the project's own re-export, not the library.** A hook that reads
  `@/hooks/useColorScheme` is mocked at that path. Mocking `react-native` to reach the same value
  hits the spread problem above and replaces far more than the test needs.
- **`Platform.select` is read once, at module load.** A module that branches on the platform has
  already chosen by the time a test imports it, so reassigning `Platform.OS` afterwards reaches
  nothing. `jest.resetModules()` with a `jest.doMock` per platform, then a fresh `require`, is the
  only way to execute a second arm, and an `afterEach` that unmocks and resets keeps one case
  out of the next.
- **A `useSyncExternalStore` hook needs all three of its callbacks run.** Stub the hook so the test
  drives them: React only reaches `getServerSnapshot` during hydration, and the unsubscribe that
  `subscribe` returns is uncovered unless the stub calls it. A hook whose value never changes after
  hydration notifies nobody, so the change callback is deliberately empty.

## Reaching what the test renderer cannot

The renderer draws a tree; it does not run a native runtime. Four consequences, each of which is a
branch you cannot reach by rendering alone:

- **A style callback is not called by rendering.** `Pressable` and friends take
  `style={({ pressed }) => ...}`, and the renderer never enters the pressed state, so that function
  is uncovered until the test pulls it off the rendered props and calls it with the state it wants.
- **A layout handler is fired by the native runtime.** Nothing measures a view under a unit test, so
  an `onLayout` branch is reached by calling the handler the props carry, with the event shape the
  runtime would have passed.
- **A primitive that ships untranspiled is stood in for.** `expo-router/ui`, `expo-web-browser` and
  the native tab bar all load real sources from `node_modules` and pull further native modules in
  behind them. Stand in for the primitive, and give the stand-in the `testID` the assertions read,
  so a test still checks the props your component chose rather than the library's rendering.
- **`render` is awaited.** It returns a promise as of `@testing-library/react-native` 14, and a
  synchronous read after it asserts the tree before the first commit.

## Writing the mock itself

- **A factory closes over `mock*` names only.** Jest lifts every `jest.mock` call above the
  imports, and refuses a factory that reads any other outer binding, since it would still be
  undefined when the factory runs. Name what it reads `mockSomething`, and read it lazily.
- **A plain property is replaced, not spied on.** `Platform.OS` and `Device.isDevice` are values
  rather than functions, so there is nothing to spy: `jest.replaceProperty` swaps the value for one
  case, and `jest.restoreAllMocks()` puts it back.

## What a component test asserts

- What renders, and what a press changes. A screen is a function of props and state, so a test
  drives it the way a person does and reads back what appears.
- Never assert on a `StyleSheet` object or a resolved style value. If the only difference a prop
  makes is a style, there is nothing to test; say so and skip it.
- Navigation is a boundary: assert that the route changed, not that a navigator internal was
  called with a shape.
