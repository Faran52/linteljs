import {
  ANSWERS,
  DEFAULT_ANSWERS,
  onlyFor,
} from '../../../packages/create/src/answers';
import { LANGUAGES } from '../../../packages/create/src/config/constants';
import { RECORD_MODULE } from '../../../packages/create/src/emitters/always/linteljs-record/linteljsRecordEmitter';
import { i18nConfigEmitter } from '../../../packages/create/src/emitters/libraries/i18n-config/i18nConfigEmitter';
import { starterSourceEmitter } from '../../../packages/create/src/emitters/target/starter-source/starterSourceEmitter';
import { testSetupEmitter } from '../../../packages/create/src/emitters/testing/test-setup/testSetupEmitter';
import { targetFor } from '../../../packages/create/src/targets';
import { valuesOf } from '../../../packages/create/src/utils/objectUtils';

import type { Answers, TargetId } from '../../../packages/create/src/config/types';

// One answer set cannot open every file: several answers pick one module out of many.
export const widestFor = (target: TargetId): Answers[] => {
  const widest: Answers = {
    ...DEFAULT_ANSWERS,
    target,
    surfaces: [
      'popup',
      'background',
      'devtools-panel',
    ],
    libraries: ['zod'],
    styling: 'tailwind',
  };
  const record = targetFor(widest);

  const forms = valuesOf(ANSWERS.form.values)
    .filter((form) => {
      const only = onlyFor(ANSWERS.form, form);

      return only === undefined || only(record, widest);
    });

  return [
    widest,
    {
      ...widest,
      browser: 'firefox',
    },
    ...forms
      .flatMap((form): Answers[] => {
        return [
          {
            ...widest,
            form,
          },
          {
            ...widest,
            form,
            libraries: [],
          },
        ];
      }),
    // A language gives a form's page its translated twin.
    ...(record.i18n === undefined || forms[0] === undefined
      ? []
      : [
          {
            ...widest,
            form: forms[0],
            languages: [...LANGUAGES],
          },
        ]),
    // Two StyleX modules ship only beside a form or a store.
    {
      ...widest,
      styling: 'stylex',
      form: 'tanstack-form',
      ...(record.stores?.[0] === undefined ? {} : { store: record.stores[0] }),
    },
    {
      ...widest,
      form: 'tanstack-form',
      data: 'tanstack-query',
    },
    // The one set that joins every test setup fragment a target can take.
    {
      ...widest,
      data: 'tanstack-query',
      mocking: 'msw',
      ...(record.i18n === undefined ? {} : { languages: [...LANGUAGES] }),
    },
    // RTK Query ships inside the Redux store.
    {
      ...widest,
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    },
    ...(record.stores ?? [])
      .map((store): Answers => {
        return {
          ...widest,
          store,
        };
      }),
    // A router's document can differ per styling: framework mode links StyleX's dev CSS itself.
    // A form adds a route to framework mode's config, and a language its translated twins.
    ...(record.routers ?? [])
      .flatMap((router): Answers[] => {
        return [
          {
            ...widest,
            router,
          },
          {
            ...widest,
            router,
            styling: 'stylex',
          },
          {
            ...widest,
            router,
            form: 'tanstack-form',
          },
          ...(record.i18n === undefined
            ? []
            : [
                {
                  ...widest,
                  router,
                  languages: [...LANGUAGES],
                },
                {
                  ...widest,
                  router,
                  styling: 'stylex' as const,
                  languages: [...LANGUAGES],
                },
              ]),
        ];
      }),
  ];
};

// Through the emitter, so a mirror that drifts from the pipeline shows as an unplaced file.
export const destinationsFor = (every: Answers[]): Map<string, string> => {
  return new Map(every
    .flatMap((answers) => {
      return starterSourceEmitter(answers)
        .flatMap((artifact) => {
          return 'sources' in artifact.content
            ? artifact.content.sources
                .map((source): [string, string] => {
                  return [source, artifact.target];
                })
            : [];
        });
    }));
};

export const writtenPaths = (every: Answers[]): Set<string> => {
  const destinations = every
    .flatMap((answers) => {
      return [
        RECORD_MODULE,
        ...i18nConfigEmitter(answers)
          .map(({ target }) => {
            return target;
          }),
        ...starterSourceEmitter(answers)
          .flatMap((artifact) => {
            return [artifact.target, ...artifact.requires ?? []];
          }),
      ];
    });

  return new Set(destinations);
};

// The fragments joined into a project's test setup, keyed by their joined order, to where the project holds them.
export const setupsFor = (every: Answers[]): Map<string, [string, string[]]> => {
  return new Map(every
    .flatMap((answers) => {
      return testSetupEmitter(answers, {
        setupTests: [],
        styleEntries: [],
      });
    })
    .flatMap((artifact): [string, [string, string[]]][] => {
      return 'sources' in artifact.content
        ? [[artifact.content.sources.join(' + '), [artifact.target, artifact.content.sources]]]
        : [];
    }));
};
