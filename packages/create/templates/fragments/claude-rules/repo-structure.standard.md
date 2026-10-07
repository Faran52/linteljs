A folder in the layout above that this project does not have yet is where the first file of that kind goes.
Create it then, not before.

## Files

- **Size is capped in lines of code**, blank lines and comments free: a function at 350, a code file at 500, a
  component file (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.astro`) at 350, a file under `utils/` at 800. Tests are
  exempt. ESLint enforces it; past a cap, split along the subjects rather than squeezing lines.
- **A component, page or hook is a subject directory**: kebab-case, holding one entry file named for the
  directory (`button/Button.tsx`, `use-extended-query/useExtendedQuery.ts`), its test beside it, and anything
  only it reads. A Solid primitive and a Vue composable count as hooks
  (`create-extended-query/createExtendedQuery.ts`). Never leave loose files at the root of `components/`,
  `pages/` or a hooks folder.
- **The router's folder is the framework's**: `app/` in Next, Angular and Expo, `pages/` in Nuxt and Astro,
  `routes/` in SvelteKit. A route file sits where its URL and the router's reserved names put it, whatever the
  rules here say. Where its suite and what it alone reads go is in the sections above.
- **A component's styles sit beside it**: its stylesheet (`Button.css`), or its class map
  `<subject>Styles.ts` (`button/buttonStyles.ts`), the one file a change of styling swaps, so the component reads
  the same either way. Its component's suite covers it. `.stylex.ts` is StyleX's name for `defineVars` and
  `defineConsts` files (`styles/tokens.stylex.ts`), never a component's sheet.
- **A file in a `utils/` folder ends in `Utils`** (`fetchExtendedUtils.ts`, or `fetch-extended-utils.ts` where
  files are kebab-case), with its test beside it. `utils/` is the one folder that holds loose module files.
- **Every other module is a subject directory.** In `store/`, `providers/`, `services/` and `apis/`, the
  directory is the subject in kebab-case and holds one entry named for the subject plus the folder's kind, in
  the case this project gives that file, with its test beside it: `store/counter/counterStore.ts`,
  `providers/data/DataProvider.tsx`, `apis/contact/contactApi.ts`, `services/billing/billingService.ts`.
  Anything only it reads sits in the same directory (its schemas, its own `utils/`).
  `config/` is data, one flat file per table.
- **Helpers go in a `utils/` folder at the level of their readers**: the subject's own `utils/` while one
  subject reads them, the nearest shared parent's when a second does, `lib/utils/` when the whole app does.
- **`constants.ts` holds data only**: values and tables, no functions and no branches. A table one subject
  reads sits in that subject's `constants.ts`; `config/` holds what the whole app reads. The types only a
  subject reads sit beside it the same way, in `types.ts` (`text-input/types.ts`).
- **A file is named for what it holds**, never for a mechanism: no `helpers.ts`, `utils.ts` or `common.ts`.
- **`index.ts` is a re-export barrel only**, nothing but `export ... from` lines. Code that runs or defines
  anything is an entry named for its subject (`i18n/i18n.ts`, `background/background.ts`, `main.tsx`). A route
  file the router names `index` is the router's.

## The folders a new file most often lands in

- `typings/`: ambient `.d.ts` only, meaning global augmentations and module shims such as asset imports.
  Never a type the code could import from its owner, and never anything with a runtime value.
- `lib/providers/` (where the layout has it): one provider per directory, named for what it provides
  (`data/DataProvider`). Components read the provider's hook; they never build the context themselves.
- `lib/services/`: domain logic, one directory per domain, named for it. A form's words and rules live here
  (`services/contact-form/contactFormService.ts`). `apis/` may read a service; a service may not import from
  `apis/` or touch HTTP. It takes data and answers data, so it tests without a network.
- `lib/apis/`: the only layer that knows HTTP. One directory per resource, holding its endpoint calls and the
  schemas of what they send and receive, every call going through the project's one fetch helper in
  `lib/utils/`. Components and services never call `fetch` themselves. Pages, their hooks and `store/` may
  import it; `services/`, `utils/` and `config/` never do.
- `lib/store/` holds this project's store. Add state there rather than a second store library. <!-- when store -->
- Server state goes through the query wrappers the starter ships over the fetch helper; a component never fetches directly. <!-- when tanstack-query -->
- Endpoints are RTK Query definitions in `lib/apis/`, extending `base/baseApi.ts`. <!-- when rtk-query -->
- `__mocks__/msw/handlers.ts` answers every endpoint in tests: add a handler with each new endpoint. <!-- when msw -->
