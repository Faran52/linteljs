import { reactFramework } from './react/reactFramework';

import type { FrameworkModule } from './types';

// Each names a `templates/frameworks/<name>/` module; its `--target` takes the rewrite instead of the old pipeline.
export const FRAMEWORKS: readonly string[] = [];

// What each framework adds to its picked drawers, by target.
export const FRAMEWORK_MODULES: Partial<Record<string, FrameworkModule>> = { react: reactFramework };
