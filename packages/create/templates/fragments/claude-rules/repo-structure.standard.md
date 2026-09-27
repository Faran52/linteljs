A folder in the layout above that this project does not have yet is where the first file of that kind goes.
Create it then, not before.

## Files

- **A code file stays under 500 lines.** Past that, split it along its subjects.
- **A component, page or hook is a subject directory**: kebab-case, holding one entry file named for the
  directory (`button/Button.tsx`, `use-extended-query/useExtendedQuery.ts`), its test beside it, and anything
  only it reads. Never leave loose files at the root of `components/`, `pages/` or a hooks folder.
- **A module in `utils/`, `config/`, `store/`, `providers/`, `services/` or `apis/` is one file** named for
  its single main export, its test beside it. It becomes a subject directory when it gains private helpers.
- **Helpers go in a `utils/` folder at the level of their readers**: the subject's own `utils/` while one
  subject reads them, the nearest shared parent's when a second does, `lib/utils/` when the whole app does.
- **`constants.ts` holds data only**: values and tables, no functions and no branches. A table one subject
  reads sits in that subject's `constants.ts`; `config/` holds what the whole app reads.

## The folders a new file most often lands in

- `typings/`: ambient `.d.ts` only, meaning global augmentations and module shims such as asset imports.
  Never a type the code could import from its owner, and never anything with a runtime value.
- `lib/providers/` (where the layout has it): one provider per file, named for what it provides
  (`DataProvider`). Components read the provider's hook; they never build the context themselves.
- `lib/services/`: domain logic, one file per domain, named for it. A service may not import from `apis/` or
  touch HTTP; it takes data and answers data, so it tests without a network.
- `lib/apis/`: the only layer that knows HTTP. One file per resource, holding its endpoint calls and the
  schemas of what they send and receive, every call going through the project's one fetch helper in
  `lib/utils/`. Components and services never call `fetch` themselves.
- `lib/store/` holds this project's store. Add state there rather than a second store library. <!-- when store -->
- Server state goes through the query wrappers the starter ships over the fetch helper; a component never fetches directly. <!-- when tanstack-query -->
- Endpoints are RTK Query definitions in `lib/apis/`, extending `baseApi.ts`. <!-- when rtk-query -->
- `__mocks__/msw/handlers.ts` answers every endpoint in tests: add a handler with each new endpoint. <!-- when msw -->
