import {
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { WORKSPACE_KEYS } from '@answers';

import { manifestReader } from './manifestReader';

describe('the shipped questions', () => {
  it('asks each key once, as a choice or a multi', async () => {
    const questions = await manifestReader();
    const keys = questions
      .map((question) => {
        return question.key;
      });
    const kinds = new Set(questions
      .map((question) => {
        return question.kind;
      }));

    const unique = new Set(keys);
    const kindSet = new Set(['choice', 'multi']);

    expect(unique.size).toBe(keys.length);
    expect(kinds).toEqual(kindSet);
  });

  it('scopes to the workspace exactly the workspace keys', async () => {
    const questions = await manifestReader();
    const workspace = questions
      .filter((question) => {
        return question.scope === 'workspace';
      })
      .map((question) => {
        return question.key;
      });
    const expected = WORKSPACE_KEYS
      .filter((key) => {
        return questions
          .some((question) => {
            return question.key === key;
          });
      });

    const sortedWorkspace = new Set(workspace);
    const sortedExpected = new Set(expected);

    expect(sortedWorkspace).toEqual(sortedExpected);
  });

  it('makes a value require only a question asked before it', async () => {
    const questions = await manifestReader();
    const late = questions
      .flatMap((question, index) => {
        const before = questions
          .slice(0, index)
          .map((earlier) => {
            return earlier.key;
          });

        return Object.values(question.values)
          .flatMap((value) => {
            return value.requires === undefined ? [] : Object.keys(value.requires);
          })
          .filter((key) => {
            return !before
              .some((earlier) => {
                return earlier === key;
              });
          });
      });

    expect(late).toEqual([]);
  });
});

describe('a broken manifest', () => {
  let root = '';

  beforeEach(async () => {
    const prefix = join(tmpdir(), 'linteljs-manifest-');

    root = await mkdtemp(prefix);
    await mkdir(join(root, 'common'));
  });

  afterEach(async () => {
    await rm(root, {
      recursive: true,
      force: true,
    });
  });

  it('throws when the file is missing', async () => {
    const reading = manifestReader(join(root, 'nowhere'));

    await expect(reading).rejects.toThrow(/is not a list of questions/u);
  });

  it.each([
    ['not a list', {}],
    ['not an object', [1]],
    ['no key', [{ kind: 'choice', values: {} }]],
    ['a key that is no answer', [{
      key: 'colour',
      kind: 'choice',
      values: {},
    }]],
    ['a key that is no string', [{
      key: 1,
      kind: 'choice',
      values: {},
    }]],
    ['no kind', [{ key: 'target', values: {} }]],
    ['a list kind', [{
      key: 'target',
      kind: 'list',
      values: {},
    }]],
    ['no values', [{ key: 'target', kind: 'multi' }]],
    ['values that are no object', [{
      key: 'target',
      kind: 'choice',
      values: [],
    }]],
  ])('throws on %s', async (_name, body) => {
    const text = JSON.stringify(body);

    await writeFile(join(root, 'common', 'questions.json'), text, 'utf8');

    const reading = manifestReader(root);

    await expect(reading).rejects.toThrow(/is not a list of questions/u);
  });
});
