import {
  describe,
  expect,
  it,
} from 'vitest';

import { type Answers, DEFAULT_ANSWERS } from '../answers/answers';
import { CONFIG_PATH } from '../answers/lintelConfig';

import { seedArtifacts } from './seedArtifacts';

import type { Artifact } from './artifact';

const seedFor = (overrides: Partial<Answers> = {}): Artifact[] => {
  return seedArtifacts({
    ...DEFAULT_ANSWERS,
    ...overrides,
  }, 'demo-app');
};

const targetsOf = (artifacts: Artifact[]): string[] => {
  return artifacts.map((artifact) => {
    return artifact.target;
  });
};

const find = (artifacts: Artifact[], target: string): Artifact => {
  const found = artifacts.find((artifact) => {
    return artifact.target === target;
  });

  if (found === undefined) {
    throw new Error(`no artifact for ${target}`);
  }

  return found;
};

describe('the recorded config', () => {
  // A run that dies between the two leaves the answers recorded rather than the dependencies they imply.
  it('comes first, in the package stage', () => {
    const seeded = seedFor();

    expect(seeded[0]?.target).toBe(CONFIG_PATH);
    expect(seeded[0]?.stage).toBe('package');
  });

  // `sync` reads this file rather than writing it, so it is seeded rather than built.
  it('is rewritten on any run rather than at birth alone', () => {
    expect(find(seedFor(), CONFIG_PATH).fresh).toBeUndefined();
  });
});

describe('the README', () => {
  it('is filled from the shipped template rather than emitted whole', () => {
    const readme = find(seedFor(), 'README.md');

    expect(readme.content).toHaveProperty('sources', ['readme/template.md']);
  });

  // `--skip-scaffold` adopts a project whose README describes the toolchain the later stages replaced.
  it('is rewritten on any run rather than at birth alone', () => {
    expect(find(seedFor(), 'README.md').fresh).toBeUndefined();
  });

  it('names the project and the toolchain the stages leave behind', () => {
    const readme = find(seedFor(), 'README.md');

    if (!('transform' in readme.content)) {
      throw new Error('README.md carries no transform');
    }

    const filled = readme.content.transform(
      '# {{PROJECT_NAME}}\n\n{{TARGET_LABEL}}\n\n{{RUN}} lint\n\n{{CHECK_CHAIN}}\n\n{{TEST_ROWS}}\n',
      null,
    );

    expect(filled).toContain('demo-app');
    expect(filled).toContain('React (Vite)');
    expect(filled).not.toContain('{{');
  });
});

describe('the manifest', () => {
  it('is absent for a target that has none', () => {
    expect(targetsOf(seedFor())).not.toContain('manifest.json');
  });

  // Birth only: a manifest's permissions and store metadata are the project's to keep.
  it('is written once for the packaged browser and never again', () => {
    const seeded = seedFor({ target: 'webextension' });

    expect(find(seeded, 'manifest.json').fresh).toBe(true);
  });

  // Chrome rejects `browser_specific_settings` and AMO requires it, so the second is named for its browser.
  it('names the second browser in its own filename', () => {
    const seeded = seedFor({
      target: 'webextension',
      browser: 'chrome',
      browsers: ['chrome', 'firefox'],
    });

    expect(targetsOf(seeded)).toContain('manifest.json');
    expect(targetsOf(seeded)).toContain('manifest.firefox.json');
  });
});

describe('the starter source', () => {
  // A router replaces the scaffolder's own entry; without one the scaffolder's stands.
  it('is birth only, so a later run leaves the project its own', () => {
    const entry = find(seedFor({ router: 'react-router' }), 'src/main.tsx');

    expect(entry.fresh).toBe(true);
  });

  it('takes the file the chosen router needs and leaves the others', () => {
    const reactRouter = targetsOf(seedFor({ router: 'react-router' }));

    expect(reactRouter).toContain('src/routes/router.tsx');
    expect(reactRouter).not.toContain('src/routes/__root.tsx');
  });

  // A test helper is a test artifact, and `testing: none` is declining it.
  it('declines a starter test when the testing answer declined one', () => {
    const covered = seedFor({ target: 'webextension' });
    const none = seedFor({
      target: 'webextension',
      testing: 'none',
    });

    expect(targetsOf(covered)).toContain('src/counter.test.ts');
    expect(targetsOf(none)).not.toContain('src/counter.test.ts');
  });

  // Skipped rather than failed: a rearranged starter costs the example, not a broken import.
  it('names the file a starter test covers, so an absent one is skipped', () => {
    const test = find(seedFor({ target: 'webextension' }), 'src/counter.test.ts');

    expect(test.requires).toBe('src/counter.ts');
  });
});
