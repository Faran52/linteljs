import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  onlyFor,
  type TargetId,
} from '../../../packages/create/src/answers';
import { RECORD_MODULE } from '../../../packages/create/src/emitters/always/linteljs-record/linteljsRecordEmitter';
import { starterSourceEmitter } from '../../../packages/create/src/emitters/target/starter-source/starterSourceEmitter';
import { targetFor } from '../../../packages/create/src/targets';
import { valuesOf } from '../../../packages/create/src/utils/objectUtils';

// Every answer set that opens a starter file. One cannot reach everything: a browser picks one background spelling,
// a router one entry, a form, store or data layer its own module beside a shared page.
export const widestFor = (target: TargetId): Answers[] => {
  const widest: Answers = {
    ...DEFAULT_ANSWERS,
    target,
    surfaces: ['popup', 'background', 'devtools-panel'],
    libraries: ['zod'],
    styling: 'tailwind',
  };
  const record = targetFor(widest);

  const forms = valuesOf(ANSWERS.form.values).filter((form) => {
    const only = onlyFor(ANSWERS.form, form);

    return only === undefined || only(record, widest);
  });

  return [
    widest,
    {
      ...widest,
      browser: 'firefox',
    },
    ...forms.flatMap((form): Answers[] => {
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
    // RTK Query ships inside the Redux store.
    {
      ...widest,
      form: 'tanstack-form',
      store: 'redux-toolkit',
      data: 'rtk-query',
    },
    ...(record.stores ?? []).map((store): Answers => {
      return {
        ...widest,
        store,
      };
    }),
    ...(record.routers ?? []).map((router): Answers => {
      return {
        ...widest,
        router,
      };
    }),
  ];
};

// `<asset> -> <destination>` through the emitter, so a mirror that drifts from the pipeline shows as an unplaced file.
export const destinationsFor = (every: Answers[]): Map<string, string> => {
  return new Map(every.flatMap((answers) => {
    return starterSourceEmitter(answers).flatMap((artifact) => {
      return 'sources' in artifact.content
        ? artifact.content.sources.map((source): [string, string] => {
            return [source, artifact.target];
          })
        : [];
    });
  }));
};

// Every path a relative import may reach: what the target writes, what each starter test covers, and the record module.
export const writtenPaths = (every: Answers[]): Set<string> => {
  return new Set(every.flatMap((answers) => {
    return [
      RECORD_MODULE,
      ...starterSourceEmitter(answers).flatMap((artifact) => {
        return [artifact.target, ...artifact.requires ?? []];
      }),
    ];
  }));
};
