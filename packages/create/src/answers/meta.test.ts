import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { directoriesIn, sourcesUnder } from '@mocks/ringShape';

import { valuesOf } from '../utils/objectUtils';

import { ANSWERS } from './registry';

import type { AnswerRecord } from './record';
import type { AnswerKey } from './registry';

interface RecordFile {
  key: string;
  path: string;
}

interface AnswerRecordFile extends RecordFile {
  key: AnswerKey;
}

const answersDir = join(import.meta.dirname);

// `utils/` holds the helpers every record shares. It answers no question, so it is not a group and holds no record.
const SHARED = new Set(['utils']);

const groups = directoriesIn(answersDir).filter((name) => {
  return !SHARED.has(name);
});

// `<group>/<key>.ts`, one file per answer: unlike `emitters/`, a record is the whole of what a file holds, so the
// file itself is the unit rather than a directory around an entry.
const found: RecordFile[] = groups.flatMap((group) => {
  return sourcesUnder(join(answersDir, group)).map((path) => {
    return {
      key: basename(path, '.ts'),
      path,
    };
  });
});

const isAnswerKey = (file: RecordFile): file is AnswerRecordFile => {
  return file.key in ANSWERS;
};

describe('the registry', () => {
  const registered = new Set(valuesOf(ANSWERS));

  // Read off disk rather than probed, so a file nobody registered is caught as well as the reverse.
  it('names every key the registry has', () => {
    expect(found.filter((file) => {
      return !isAnswerKey(file);
    }).map((file) => {
      return file.key;
    })).toEqual([]);
  });

  it('names nothing that is not a registered key', () => {
    const present = new Set(found.map((file) => {
      return file.key;
    }));

    expect([...registered].filter((key) => {
      return !present.has(key);
    })).toEqual([]);
  });

  it('holds exactly one file per key across the groups', () => {
    const keys = found.map((file) => {
      return file.key;
    });

    expect(keys.filter((key, index) => {
      return keys.indexOf(key) !== index;
    })).toEqual([]);
  });
});

describe.each(found.filter(isAnswerKey))('$key', ({ key, path }) => {
  it('exports a const named for the file', () => {
    expect(readFileSync(path, 'utf8')).toContain(`export const ${key} = `);
  });

  it("carries that same name as its own record's key", () => {
    expect(ANSWERS[key].key).toBe(key);
  });
});

describe('flags', () => {
  it('names each one once', () => {
    const records: readonly AnswerRecord[] = valuesOf(ANSWERS).map((key) => {
      return ANSWERS[key];
    });

    const flags = records.map((record) => {
      return record.flag;
    }).filter((flag): flag is string => {
      return flag !== undefined;
    });

    expect(flags.filter((flag, index) => {
      return flags.indexOf(flag) !== index;
    })).toEqual([]);
  });
});
