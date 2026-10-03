import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  describe,
  expect,
  it,
} from 'vitest';

import { TEMPLATES_ROOT } from '@disk';

import { copiedOf, templateOf } from './copiedUtils';

const BASE = 'fragments/test-setup/setupTests.ts';
const MSW = 'fragments/test-setup/setupTests.msw.ts';
const SOURCES = [BASE, MSW];
const TARGET = '__mocks__/setupTests.ts';

const templateText = (source: string): string => {
  const path = join(TEMPLATES_ROOT, source);
  return readFileSync(path, 'utf8');
};

const upper = (source: string): string => {
  return source.toUpperCase();
};

describe('copiedOf', () => {
  it('joins the sources as a new file receives them', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: { sources: SOURCES },
    };
    const [copied] = copiedOf(artifact);
    const expected = SOURCES
      .map(templateText)
      .join('\n');
    const text = copied?.text();

    expect(copied?.target).toBe(TARGET);
    expect(copied?.sources).toStrictEqual(SOURCES);
    expect(text).toBe(expected);
  });

  it('applies the transform to the joined text', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: {
        sources: [BASE],
        transform: upper,
      },
    };
    const [copied] = copiedOf(artifact);
    const baseText = templateText(BASE);
    const expected = upper(baseText);
    const text = copied?.text();

    expect(text).toBe(expected);
  });

  it('skips an artifact written from no template', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: { text: 'export {};\n' },
    };
    const copied = copiedOf(artifact);

    expect(copied).toStrictEqual([]);
  });
});

describe('templateOf', () => {
  it('hands a fix back through a transform that leaves the fixed text as it is', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: {
        sources: [BASE],
        transform: upper,
      },
    };
    const source = templateOf(artifact, 'FIXED\n');

    expect(source).toBe(BASE);
  });

  it('keeps a fix the transform would write differently', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: {
        sources: [BASE],
        transform: upper,
      },
    };
    const source = templateOf(artifact, 'fixed\n');

    expect(source).toBeUndefined();
  });

  it('hands a fix back to a template copied with no transform', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: { sources: [BASE] },
    };
    const source = templateOf(artifact, 'fixed\n');

    expect(source).toBe(BASE);
  });

  it('keeps a fix to a file joined from several templates', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: { sources: SOURCES },
    };
    const source = templateOf(artifact, 'fixed\n');

    expect(source).toBeUndefined();
  });

  it('keeps a fix to a file written from no template', () => {
    const artifact = {
      stage: 'standard' as const,
      target: TARGET,
      content: { text: 'export {};\n' },
    };
    const source = templateOf(artifact, 'export {};\n');

    expect(source).toBeUndefined();
  });
});
