import {
  browsersOf,
  hasLibrary,
  hasTests,
} from '../answers/answers';
import { CONFIG_PATH } from '../answers/lintelConfig';
import { targetFor } from '../targets';

import {
  type Artifact,
  copied,
  emitted,
} from './artifact';
import { emitLintelConfig } from './lintel-config/emitLintelConfig';
import { emitManifest } from './manifest/emitManifest';
import { emitReadme } from './readme/emitReadme';

import type { Answers } from '../answers/answers';

/**
 * What a project is seeded with and owns afterwards: its README, its manifest, and the starter source no
 * scaffolder wrote. Kept out of `buildArtifacts` on purpose, because that list is what `sync` re-applies and
 * none of this is lintel's to maintain once the project has it. Everything here still reaches disk as an
 * `Artifact`, so `applyArtifact` is the only writer either way.
 */
export const seedArtifacts = (answers: Answers, name: string): Artifact[] => {
  const target = targetFor(answers);

  const artifacts: Artifact[] = [
    /**
     * The record every later run replans from. Written on every `create` and never by `sync`, which reads it: a
     * project that reformatted its own config keeps those bytes through a `sync --force`, which `cli.test.ts` pins.
     * First, so a run that dies between here and `package.json` leaves the answers recorded rather than the
     * dependencies they imply.
     */
    emitted('package', CONFIG_PATH, emitLintelConfig(answers)),
    // Every scaffolder's README describes a toolchain the later stages replaced, so this one is rewritten on any
    // run rather than at birth alone: `--skip-scaffold` adopts a project whose README says the same wrong thing.
    {
      stage: 'standard',
      target: 'README.md',
      content: {
        sources: ['readme/template.md'],
        transform: (source: string) => {
          return emitReadme(source, name, answers);
        },
      },
    }];

  // One per packaged browser; the second is named for its browser since Chrome rejects `browser_specific_settings`
  // and AMO requires it. Birth only: a manifest's permissions and store metadata are the project's to keep.
  for (const browser of browsersOf(answers)) {
    const manifest = emitManifest(answers, name, browser);

    if (manifest !== null) {
      artifacts.push({
        ...emitted(
          'standard',
          browser === answers.browser ? 'manifest.json' : `manifest.${browser}.json`,
          manifest,
        ),
        fresh: true,
      });
    }
  }

  // Never a test helper the testing answer declined: a test artifact is what `testing: none` is declining.
  for (const file of target.starterFiles ?? []) {
    if ((file.library === undefined || hasLibrary(answers, file.library))
      && (file.router === undefined || answers.router === file.router)
      && (file.tests === undefined || hasTests(answers))) {
      artifacts.push({
        ...copied(file.target, file.source),
        fresh: true,
      });
    }
  }

  // After the starter files, since one of them is what a starter test covers.
  if (hasTests(answers)) {
    for (const test of target.starterTests ?? []) {
      artifacts.push({
        ...copied(test.target, test.source),
        fresh: true,
        requires: test.covers,
      });
    }
  }

  return artifacts;
};
