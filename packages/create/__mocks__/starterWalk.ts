import { valuesOf } from '@utils/objectUtils';

import {
  ANSWERS,
  type Answers,
  DEFAULT_ANSWERS,
  type TargetId,
} from '@answers';

import type { TargetBuilder } from '@targets/registry';
import type {
  StarterFile,
  StarterTest,
  TargetRecord,
} from '@targets/types';

/**
 * What a target record's `when`s do across every answer set they can see. A record is read by
 * `starterSourceEmitter`, which refuses two spellings of one destination, and by `styleEntryEmitter`; each gate is a
 * predicate over the answers, so walking the answers is the direct test of all of them at once.
 */
export interface StarterWalk {
  // Destinations two entries both wrote under one answer set: a variant that forgot to exclude its base.
  twice: string[];
  // Gated entries whose `when` never changed across the walk, so the gate decides nothing, or nothing ever writes it.
  fixed: string[];
}

interface Gated {
  key: string;
  when: ((answers: Answers) => boolean)
    | undefined;
}

// One override per value an answer takes, and the empty one for leaving it unanswered.
const answered = <K extends keyof Answers>(key: K, values: Answers[K][], unanswered = true): Partial<Answers>[] => {
  return [
    ...unanswered ? [{}] : [],
    ...values.map((value): Partial<Answers> => {
      return { [key]: value };
    }),
  ];
};

// Every answer a `when` reads, each at every value the target offers, the unanswered one included.
export const answerSets = (builder: TargetBuilder, target: TargetId): Answers[] => {
  const base: Answers = {
    ...DEFAULT_ANSWERS,
    target,
  };
  const {
    hostsBrowser,
    hostsFramework,
    routers = [],
    stores = [],
  } = builder(base);
  const axes: Partial<Answers>[][] = [
    answered('store', [...stores]),
    answered('form', valuesOf(ANSWERS.form.values)),
    answered('data', valuesOf(ANSWERS.data.values)),
    answered('router', [...routers]),
    answered('styling', valuesOf(ANSWERS.styling.values)),
    answered('mocking', valuesOf(ANSWERS.mocking.values)),
    answered('libraries', [[], ['zod']], false),
    answered('testing', valuesOf(ANSWERS.testing.values), false),
    ...hostsFramework === true ? [answered('hostedFramework', valuesOf(ANSWERS.hostedFramework.values))] : [],
    ...hostsBrowser === true
      ? [
          answered('browser', valuesOf(ANSWERS.browser.values), false),
          answered('surfaces', [[], ...valuesOf(ANSWERS.surfaces.values).map((surface) => {
            return [surface];
          })]),
        ]
      : [],
  ];

  return axes.reduce<Answers[]>((sets, overrides) => {
    return sets.flatMap((answers) => {
      return overrides.map((override): Answers => {
        return {
          ...answers,
          ...override,
        };
      });
    });
  }, [base]);
};

// Keyed by what an entry writes and which spelling, counted, so a key names one entry whichever answers built it.
const gatedOf = (record: TargetRecord): Gated[] => {
  const seen = new Map<string, number>();
  const keyed = (list: string, path: string, variant: string | undefined): string => {
    const stem = `${list} ${path} ${variant ?? 'base'}`;
    const count = seen.get(stem) ?? 0;

    seen.set(stem, count + 1);

    return count === 0 ? stem : `${stem} #${String(count + 1)}`;
  };
  const entry = (list: string) => {
    return (file: StarterFile | StarterTest): Gated => {
      return {
        key: keyed(list, file.target, file.variant),
        when: file.when,
      };
    };
  };

  return [
    ...record.starterFiles.map(entry('file')),
    ...record.starterTests.map(entry('test')),
    ...(record.starterStyles ?? []).map((style): Gated => {
      return typeof style === 'string'
        ? {
            key: keyed('style', style, undefined),
            when: undefined,
          }
        : {
            key: keyed('style', style.path, undefined),
            when: style.when,
          };
    }),
  ];
};

// The emitter's own reading: every file whose `when` holds, and every suite too unless testing was declined.
const writtenBy = (record: TargetRecord, answers: Answers): string[] => {
  return [
    ...record.starterFiles,
    ...answers.testing === 'none' ? [] : record.starterTests,
  ].filter((file) => {
    return file.when === undefined || file.when(answers);
  }).map((file) => {
    return file.target;
  });
};

export const walkStarters = (builder: TargetBuilder, target: TargetId): StarterWalk => {
  const twice = new Set<string>();
  const held = new Set<string>();
  const refused = new Set<string>();
  const gated = new Set<string>();

  for (const answers of answerSets(builder, target)) {
    const record = builder(answers);
    const written = writtenBy(record, answers);

    for (const [index, path] of written.entries()) {
      if (written.indexOf(path) !== index) {
        twice.add(path);
      }
    }

    for (const { key, when } of gatedOf(record)) {
      if (when !== undefined) {
        gated.add(key);
        (when(answers) ? held : refused).add(key);
      }
    }
  }

  return {
    twice: [...twice],
    fixed: [...gated].filter((key) => {
      return !held.has(key) || !refused.has(key);
    }),
  };
};
