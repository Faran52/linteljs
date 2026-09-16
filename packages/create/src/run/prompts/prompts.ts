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
  FORM_LIBRARIES,
  HOSTED_FRAMEWORKS,
  type HostedFramework,
  isValidProjectName,
  LIBRARIES,
  type Library,
  PACKAGE_MANAGERS,
  PLUGINS,
  PROJECT_NAME_RULE,
  REACT_LIBRARIES,
  type Router,
  type Surface,
  SURFACES,
  surfacesOf,
  TARGET_IDS,
  type TargetId,
  TESTING_CHOICES,
  TYPE_SAFETY_CHOICES,
} from '../../model/answers/answers';
import { targetFor } from '../../model/targets';

import type { StoreSlot, TargetRecord } from '../../model/targets/record';

/**
 * `@clack/prompts` is the one dependency this CLI carries: reading raw keypresses is not something `node:readline`
 * does. Fixed at `string` because `Option<Value>` only resolves its `label` for a primitive it can see at the call
 * site; `askChoice` and `askMulti` recover the literal union with the one cast the standard grants.
 */
export interface Prompter {
  select: (opts: SelectOptions<string>) => Promise<string | symbol>;
  multiselect: (opts: MultiSelectOptions<string>) => Promise<string[] | symbol>;
  text: (opts: TextOptions) => Promise<string | symbol>;
  // Ctrl+C resolves a cancel symbol instead of a value; `unwrap` tells the two apart with this.
  isCancel: (value: string | readonly string[] | symbol) => value is symbol;
}

export interface AskInput {
  // Already known (argument or directory name): the question is not asked.
  name?: string | undefined;
}

export interface Asked {
  name: string;
  answers: Answers;
}

// Display only: the persisted value is never the label or the hint.
interface Described {
  label: string;
  hint?: string;
}

interface HostAnswers {
  browser: Browser;
  surfaces: Surface[] | undefined;
  hosted: HostedFramework | 'none';
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
  pnpm: {
    label: 'pnpm',
    hint: 'Content-addressed store, strict by default',
  },
  npm: {
    label: 'npm',
    hint: 'Ships with Node',
  },
  yarn: {
    label: 'Yarn',
    hint: 'Yarn Berry with node_modules linking',
  },
  bun: {
    label: 'Bun',
    hint: 'Fast installs; runs scripts under Bun',
  },
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
  'tanstack-form': {
    label: 'TanStack Form',
    hint: 'Typed forms with Zod-ready validation',
  },
  'react-hook-form': {
    label: 'React Hook Form',
    hint: 'Uncontrolled React forms, React targets only',
  },
  'tailwind': {
    label: 'Tailwind CSS',
    hint: 'Utility-first styling; NativeWind on React Native',
  },
  'es-toolkit': {
    label: 'es-toolkit',
    hint: 'Typed utility functions, the modern lodash',
  },
  'ts-pattern': {
    label: 'ts-pattern',
    hint: 'Exhaustive pattern matching',
  },
  't3-env': {
    label: 't3-env',
    hint: 'Zod-validated environment variables',
  },
};

const ROUTER_DESCRIPTIONS: Record<Router | 'none', Described> = {
  'none': {
    label: 'None',
    hint: 'A single page, or a router added later',
  },
  'react-router': {
    label: 'React Router',
    hint: 'Declarative routes in src/routes/router.tsx',
  },
  'tanstack-router': {
    label: 'TanStack Router',
    hint: 'Type-safe file routes under src/routes/',
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
    hint: 'With the React Compiler',
  },
  vue: {
    label: 'Vue',
    hint: 'Single-file components',
  },
  svelte: {
    label: 'Svelte',
    hint: 'Svelte 5 runes',
  },
  solid: {
    label: 'Solid',
    hint: 'Fine-grained signals',
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

// The real terminal; tests substitute their own.
export const clackPrompter: Prompter = {
  select,
  multiselect,
  text,
  isCancel,
};

// Thrown by `cli.ts` before `ask`: nothing here can tell "no terminal" from a person who cancelled one.
export const NOTHING_ANSWERED_MESSAGE
  = 'Nothing was written: answer every question, or pass --yes to accept the defaults.';

// Ctrl+C on purpose, told apart by `error.code` the way a filesystem error already is.
export const RUN_CANCELLED_MESSAGE = 'Cancelled: nothing was written.';

const unwrap = <T extends string | readonly string[]>(prompter: Prompter, value: T | symbol): T => {
  if (prompter.isCancel(value)) {
    throw Object.assign(new Error(RUN_CANCELLED_MESSAGE), { code: 'CANCELLED' });
  }

  return value;
};

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

  // `Prompter` erases every choice to `string`; a cast onto the bare generic parameter is the one the standard grants.
  return unwrap(prompter, answer) as T;
};

// A radio, not a yes/no: a target that comes to offer two stores names both here. The persisted answer stays boolean.
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

// `required` is clack's own gate on an empty submission. Filtering `choices` recovers `T` and fixes the answer's order.
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
  return askMulti(prompter, 'AI agents', AGENTS, DEFAULT_ANSWERS.agents, false, (agent) => {
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

// The two host targets ask for what they render with; `none` is a real answer, so the question is not skipped.
const askHost = async (prompter: Prompter, record: TargetRecord): Promise<HostAnswers> => {
  const browser = record.hostsBrowser === true
    ? await askChoice(prompter, 'Browser', BROWSERS, DEFAULT_ANSWERS.browser, (choice) => {
        return BROWSER_DESCRIPTIONS[choice];
      })
    : DEFAULT_ANSWERS.browser;

  // Required: an extension with no surface builds a manifest naming nothing.
  const surfaces = record.hostsBrowser === true
    ? await askMulti(prompter, 'Surfaces', SURFACES, surfacesOf(DEFAULT_ANSWERS), true, (choice) => {
        return SURFACE_DESCRIPTIONS[choice];
      })
    : undefined;

  const hosted = record.hostsFramework === true
    ? await askChoice(prompter, 'UI framework', ['none', ...HOSTED_FRAMEWORKS], 'none', (choice) => {
        return HOSTED_FRAMEWORK_DESCRIPTIONS[choice];
      })
    : 'none';

  return {
    browser,
    surfaces,
    hosted,
  };
};

// The checkbox list, then the form library as a radio: one form library at most.
const askLibraries = async (
  prompter: Prompter,
  target: TargetId,
  hosted: HostedFramework | 'none',
): Promise<Library[]> => {
  const isReact = targetFor({
    ...DEFAULT_ANSWERS,
    target,
    ...(hosted === 'none' ? {} : { hostedFramework: hosted }),
  }).framework === 'react';
  const offered = (library: Library): boolean => {
    return isReact || !REACT_LIBRARIES.includes(library);
  };
  const picked = await askMulti(
    prompter,
    'Libraries',
    LIBRARIES.filter((library) => {
      return !FORM_LIBRARIES.includes(library) && offered(library);
    }),
    DEFAULT_ANSWERS.libraries,
    false,
    (choice) => {
      return LIBRARY_DESCRIPTIONS[choice];
    },
  );
  const forms: ('none' | Library)[] = ['none', ...FORM_LIBRARIES.filter(offered)];
  const form = await askChoice(prompter, 'Form library', forms, 'none', (choice) => {
    return choice === 'none'
      ? {
          label: 'None',
          hint: 'Plain controlled inputs',
        }
      : LIBRARY_DESCRIPTIONS[choice];
  });

  return LIBRARIES.filter((library) => {
    return picked.includes(library) || library === form;
  });
};

// In order: project name, framework, testing, package manager, libraries, form library, an optional router and store,
// type safety, AI agents, AI plugins. A target with no `routers` or `store` slot skips that question.
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

  const record = targetFor({
    ...DEFAULT_ANSWERS,
    target,
  });

  const {
    browser,
    surfaces,
    hosted,
  } = await askHost(prompter, record);

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
  const libraries = await askLibraries(prompter, target, hosted);

  const router = record.routers === undefined
    ? 'none'
    : await askChoice(prompter, 'Router', ['none', ...record.routers], 'none', (choice) => {
        return ROUTER_DESCRIPTIONS[choice];
      });

  // No slot, no question, and `store` stays false.
  const store = record.store === undefined ? false : await askStore(prompter, record.store);

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
  const plugins = agents.length > 0
    ? await askMulti(prompter, 'AI plugins', PLUGINS, PLUGINS, false, (choice) => {
        return PLUGIN_DESCRIPTIONS[choice];
      })
    : [];

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
      ...(router === 'none' ? {} : { router }),
      store,
      typeSafety,
      agents,
      plugins,
    },
  };
};
