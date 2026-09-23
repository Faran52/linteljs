import { env } from 'node:process';

import { valuesOf } from '@utils/objectUtils';

import { ANSWERS } from '@answers';

export const AGENTS = valuesOf(ANSWERS.agents.values);
export const BROWSERS = valuesOf(ANSWERS.browser.values);
export const DATA_CHOICES = valuesOf(ANSWERS.data.values);
export const FORMS = valuesOf(ANSWERS.form.values);
export const HOSTED_FRAMEWORKS = valuesOf(ANSWERS.hostedFramework.values);
export const LIBRARIES = valuesOf(ANSWERS.libraries.values);
export const PACKAGE_MANAGERS = valuesOf(ANSWERS.packageManager.values);
export const PLUGINS = valuesOf(ANSWERS.plugins.values);
export const STYLING_CHOICES = valuesOf(ANSWERS.styling.values);
export const SURFACES = valuesOf(ANSWERS.surfaces.values);
export const TARGET_IDS = valuesOf(ANSWERS.target.values);
export const TESTING_CHOICES = valuesOf(ANSWERS.testing.values);
export const TYPE_SAFETY_CHOICES = valuesOf(ANSWERS.typeSafety.values);

/**
 * A stride rather than a slice, and over every target's cases rather than over the files: each shard then holds an
 * even share of every target, so a shard is never the one that drew React Native and Angular. Vitest's own `--shard`
 * splits by file, and one file holds every target.
 *
 * Every shard is its own machine in `e2e.yml`, so every shard starts its own registry on the same port. Two on one
 * machine would collide, which `requireFreePort` refuses by design: local parallelism is `maxConcurrency` inside one
 * process against one registry, not several processes against several.
 */
export const SHARD = Number(env['E2E_SHARD'] ?? '1');
export const SHARDS = Number(env['E2E_SHARDS'] ?? '1');
