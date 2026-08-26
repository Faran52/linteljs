import {
  isCancel,
  multiselect,
  type MultiSelectOptions,
  type Option,
  select,
  type SelectOptions,
  text,
  type TextOptions,
} from '@clack/prompts';

import {
  AGENTS,
  type Answers,
  type Browser,
  BROWSERS,
  DEFAULT_ANSWERS,
  HOSTED_FRAMEWORKS,
  type HostedFramework,
  isValidProjectName,
  LIBRARIES,
  PACKAGE_MANAGERS,
  PLUGINS,
  PROJECT_NAME_RULE,
  type Surface,
  SURFACES,
  surfacesOf,
  TARGET_IDS,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';
import { type StoreSlot } from '../../model/targets/record';

/**
 * Nine questions asked over `@clack/prompts`, the one dependency this CLI carries: reading raw keypresses off a
 * real terminal is not something `node:util`/`node:readline` do, and a scaffolder that hands off to another
 * scaffolder still owes its own nine questions a legible interface.
 *
 * Fixed at `string`, not clack's own `<Value>`: every choice this questionnaire ever offers is a string, and
 * `Option<Value>` only resolves its optional-vs-required `label` for a `Value` TypeScript can see is a primitive at
 * the call site, which a naked generic parameter never is. `askChoice` and `askMulti` recover the caller's literal
 * union type themselves, each with the one cast the standard grants: `as T` onto the generic parameter they declare.
 */
export interface Prompter {
  select: (opts: SelectOptions<string>) => Promise<string | symbol>;
  multiselect: (opts: MultiSelectOptions<string>) => Promise<string[] | symbol>;
  text: (opts: TextOptions) => Promise<string | symbol>;
  // Every one of the three above resolves to a cancel symbol instead of its value when a person hits Ctrl+C
  // mid-questionnaire; `isCancel` is how `unwrap` tells that apart from a real answer.
  isCancel: typeof isCancel;
}

export interface AskInput {
  // Already resolved (positional argument, `--name`, or a directory name where the scaffold stage is skipped): the
  // question is not asked. `undefined` asks it, first.
  name?: string | undefined;
}

export interface Asked {
  name: string;
  answers: Answers;
}

/**
 * What every option this questionnaire ever offers needs to display: a label in the product's own name and casing,
 * and an optional hint for what it does or means. The persisted value is never either of these; both are display
 * only, read by `askChoice`/`askMulti` and thrown away once `select`/`multiselect` resolves.
 */
interface Described {
  label: string;
  hint?: string;
}

const TESTING_DESCRIPTIONS: Record<Answers['testing'], Described> = {
  vitest: {
    label: 'Vitest',
    hint: 'Test runner with built-in coverage',
  },
  none: {
    label: 'None',
    hint: 'No test suite',
  },
};

const PACKAGE_MANAGER_DESCRIPTIONS: Record<Answers['packageManager'], Described> = {
  pnpm: { label: 'pnpm' },
  npm: { label: 'npm' },
  yarn: { label: 'Yarn' },
  bun: { label: 'Bun' },
};

const LIBRARY_DESCRIPTIONS: Record<Answers['libraries'][number], Described> = {
  'zod': {
    label: 'Zod',
    hint: 'Schema validation and parsing',
  },
  'tanstack-query': {
    label: 'TanStack Query',
    hint: 'Async data fetching and caching',
  },
  'tailwind': {
    label: 'Tailwind CSS',
    hint: 'Utility-first styling',
  },
};

const BROWSER_DESCRIPTIONS: Record<Browser, Described> = {
  chrome: {
    label: 'Chrome',
    hint: 'MV3 service worker',
  },
  firefox: {
    label: 'Firefox',
    hint: 'MV3 event page, packaged with web-ext',
  },
};

const SURFACE_DESCRIPTIONS: Record<Surface, Described> = {
  'popup': {
    label: 'Popup',
    hint: 'The toolbar button\'s page',
  },
  'background': {
    label: 'Background',
    hint: 'The service worker or event page',
  },
  'devtools-panel': {
    label: 'DevTools panel',
    hint: 'A tab inside the browser\'s developer tools',
  },
};

// `none` is not a `HostedFramework`, so it is spelled here rather than added to the vocabulary for one prompt.
const HOSTED_FRAMEWORK_DESCRIPTIONS: Record<HostedFramework | 'none', Described> = {
  none: {
    label: 'None',
    hint: 'Plain TypeScript and the DOM',
  },
  react: {
    label: 'React',
    hint: '',
  },
  vue: {
    label: 'Vue',
    hint: '',
  },
  svelte: {
    label: 'Svelte',
    hint: '',
  },
  solid: {
    label: 'Solid',
    hint: '',
  },
};

const TYPE_SAFETY_DESCRIPTIONS: Record<Answers['typeSafety'], Described> = {
  strict: {
    label: 'Strict',
    hint: 'Bans casts, any and suppression directives',
  },
  relaxed: {
    label: 'Relaxed',
    hint: 'Only what the compiler itself catches',
  },
};

const AGENT_DESCRIPTIONS: Record<Answers['agents'][number], Described> = {
  'claude-code': {
    label: 'Claude Code',
    hint: "Anthropic's coding agent",
  },
  'codex': {
    label: 'Codex',
    hint: "OpenAI's coding agent",
  },
};

const PLUGIN_DESCRIPTIONS: Record<Answers['plugins'][number], Described> = {
  'ponytail': {
    label: 'Ponytail',
    hint: 'Keeps changes small and questions bloat',
  },
  'context7': {
    label: 'Context7',
    hint: 'Pulls current library docs into context',
  },
  'frontend-design': {
    label: 'Frontend Design',
    hint: 'Guidance on visual and UX choices',
  },
};

// The real terminal. `cli.ts` uses this by default and a test substitutes its own, so nothing here ever has to fake
// keypresses to prove what a question does.
export const clackPrompter: Prompter = {
  select,
  multiselect,
  text,
  isCancel,
};

/**
 * The one guard for a run with no terminal to answer from: a pipe, a hook or CI that would otherwise silently take
 * every default. `cli.ts` throws this itself, before ever calling `ask`, since nothing in this file is in a position
 * to tell "no terminal" apart from a person who cancelled a real one.
 */
export const NOTHING_ANSWERED_MESSAGE
  = 'Nothing was written: answer every question, or pass --yes to accept the defaults.';

/**
 * A person hit Ctrl+C mid-questionnaire, on purpose: a different problem from `NOTHING_ANSWERED_MESSAGE` above, and
 * told differently, since "answer every question" is advice for a situation a person who just quit is not in.
 * `error.code` follows this codebase's own way of tagging a thrown `Error` (`'code' in error`, the same shape a
 * filesystem error already carries) rather than a new `Error` subclass, so `cli.ts` tells the two apart by the one
 * property either kind of "special" error already carries.
 */
export const RUN_CANCELLED_MESSAGE = 'Cancelled: nothing was written.';

const unwrap = <T>(prompter: Prompter, value: T | symbol): T => {
  if (prompter.isCancel(value)) {
    throw Object.assign(new Error(RUN_CANCELLED_MESSAGE), { code: 'CANCELLED' });
  }

  return value;
};

/**
 * Every choice carries its own `describe`: with a label and hint per option now standard across every question,
 * there is no longer one shared default worth having. A `select` only ever resolves to one of `choices`, so there is
 * nothing here left to mistype the way free text over readline could.
 */
const askChoice = async <T extends string>(
  prompter: Prompter,
  message: string,
  choices: T[],
  initialValue: T,
  describe: (choice: T) => Described,
): Promise<T> => {
  const options: Option<string>[] = choices.map((choice) => {
    return {
      value: choice,
      ...describe(choice),
    };
  });

  const answer = await prompter.select({
    message,
    initialValue,
    options,
  });

  // `Prompter` erases every choice to `string`, so `T` comes back the one way the standard still allows: a cast onto
  // the bare generic parameter this function itself declares, not onto a shape built from it.
  return unwrap(prompter, answer) as T;
};

/**
 * A radio rather than a yes/no, so the option list is the shape the answer grows into: every target with a slot
 * offers exactly one store today, and a target that comes to offer two names both here without the question
 * changing kind. `none` is an option of its own rather than the absence of a yes.
 *
 * The persisted answer is still the boolean `store` the schema has always carried, so a second store per target is
 * a schema change as well as a list change; this is the display half of it, done first because it is the half a
 * person sees.
 */
const STORE_CHOICES = ['store', 'none'] as const;

const askStore = async (prompter: Prompter, slot: StoreSlot): Promise<boolean> => {
  const chosen = await askChoice(prompter, 'State store', [...STORE_CHOICES], 'none', (choice) => {
    return choice === 'none'
      ? {
          label: 'None',
          hint: "The framework's own state, and nothing installed",
        }
      : {
          label: slot.label,
          hint: `Installs ${slot.label} and gives it a place to live`,
        };
  });

  return chosen === 'store';
};

/**
 * A checkbox list, not comma-separated text: `multiselect` only ever hands back values drawn from `choices`, already
 * deduplicated by the widget itself. `required` is clack's own gate on an empty submission, which is how the agent
 * question enforces the schema's `minItems: 1` without this file re-implementing the check. Filtering `choices` by
 * what came back both recovers `T` without a cast and reorders the answer to `choices`' own order, since selecting
 * them out of order should not make the written answer order-dependent.
 */
const askMulti = async <T extends string>(
  prompter: Prompter,
  message: string,
  choices: readonly T[],
  initialValues: readonly T[],
  required: boolean,
  describe: (choice: T) => Described,
): Promise<T[]> => {
  const options: Option<string>[] = choices.map((choice) => {
    return {
      value: choice,
      ...describe(choice),
    };
  });

  const answer = await prompter.multiselect({
    message,
    initialValues: [...initialValues],
    required,
    options,
  });

  const selected = unwrap(prompter, answer);

  return choices.filter((choice) => {
    return selected.includes(choice);
  });
};

const askAgents = async (prompter: Prompter): Promise<Answers['agents']> => {
  return askMulti(prompter, 'AI agents', AGENTS, ['claude-code'], true, (agent) => {
    return AGENT_DESCRIPTIONS[agent];
  });
};

const askName = async (prompter: Prompter): Promise<string> => {
  const answer = await prompter.text({
    message: 'Project name',
    placeholder: 'my-app',
    validate: (value) => {
      return isValidProjectName(value ?? '') ? undefined : `must be ${PROJECT_NAME_RULE}`;
    },
  });

  return unwrap(prompter, answer);
};

/**
 * Nine questions, in order: project name, framework, testing, package manager, libraries, an optional store, type
 * safety, AI agents, AI plugins. A target with no `store` slot skips the store question (see `StoreSlot`); no
 * language question, since this CLI is TS-only.
 */
export const ask = async (prompter: Prompter, input: AskInput = {}): Promise<Asked> => {
  const name = input.name ?? await askName(prompter);

  const target = await askChoice(prompter, 'Framework', TARGET_IDS, DEFAULT_ANSWERS.target, (id) => {
    return {
      label: targetFor({
        ...DEFAULT_ANSWERS,
        target: id,
      }).label,
    };
  });

  // Only `label` and `store` are read here, and neither varies by an answer still unasked.
  const record = targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });

  // Both are asked only where the target has the slot, the way the store question already works. A host with no
  // framework is a real answer rather than a missing one, so `none` is offered rather than the question skipped.
  const browser = record.hostsBrowser === true
    ? await askChoice(prompter, 'Browser', BROWSERS, DEFAULT_ANSWERS.browser, (choice) => {
        return BROWSER_DESCRIPTIONS[choice];
      })
    : DEFAULT_ANSWERS.browser;

  // Required, because an extension with no surface is not an extension: it would build to a manifest naming nothing.
  // Defaults to the pair this target wrote before the question existed.
  const surfaces = record.hostsBrowser === true
    ? await askMulti(prompter, 'Surfaces', SURFACES, surfacesOf(DEFAULT_ANSWERS), true, (choice) => {
        return SURFACE_DESCRIPTIONS[choice];
      })
    : undefined;

  const hosted = record.hostsFramework === true
    ? await askChoice(
        prompter,
        'UI framework',
        ['none', ...HOSTED_FRAMEWORKS],
        'none',
        (choice) => {
          return HOSTED_FRAMEWORK_DESCRIPTIONS[choice];
        },
      )
    : 'none';

  const testing = await askChoice(prompter, 'Testing', TESTING_CHOICES, DEFAULT_ANSWERS.testing, (choice) => {
    return TESTING_DESCRIPTIONS[choice];
  });
  const packageManager = await askChoice(
    prompter,
    'Package manager',
    PACKAGE_MANAGERS,
    DEFAULT_ANSWERS.packageManager,
    (choice) => {
      return PACKAGE_MANAGER_DESCRIPTIONS[choice];
    },
  );
  const libraries = await askMulti(prompter, 'Libraries', LIBRARIES, [], false, (choice) => {
    return LIBRARY_DESCRIPTIONS[choice];
  });

  // The slot guards first: a target with no store slot stays at false, and the question is never asked, whatever
  // `--store`/`--no-store` said.
  let store = false;

  if (record.store !== undefined) {
    store = await askStore(prompter, record.store);
  }

  const typeSafety = await askChoice(
    prompter,
    'Type safety',
    TYPE_SAFETY_CHOICES,
    DEFAULT_ANSWERS.typeSafety,
    (choice) => {
      return TYPE_SAFETY_DESCRIPTIONS[choice];
    },
  );
  const agents = await askAgents(prompter);
  const plugins = await askMulti(prompter, 'AI plugins', PLUGINS, PLUGINS, false, (choice) => {
    return PLUGIN_DESCRIPTIONS[choice];
  });

  return {
    name,
    answers: {
      target,
      browser,
      ...(hosted === 'none' ? {} : { hostedFramework: hosted }),
      ...(surfaces === undefined ? {} : { surfaces }),
      testing,
      packageManager,
      libraries,
      store,
      typeSafety,
      agents,
      plugins,
    },
  };
};
