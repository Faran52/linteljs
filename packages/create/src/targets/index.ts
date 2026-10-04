export {
  FOLDER_ROUTED,
  OUTSIDE_TESTS,
} from './constants';
export {
  type TargetBuilder,
  targetFor,
  TARGETS,
} from './registry';
export type {
  PluginSpec,
  ScopedOverride,
  StarterFile,
  StarterTest,
  TargetRecord,
  TsconfigPlugin,
} from './types';
export { starterApplies } from './utils/gateUtils';
