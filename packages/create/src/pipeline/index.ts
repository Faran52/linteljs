export type { PipelineOptions } from './runs/pipeline/pipelineRun';
export { pipelineRun } from './runs/pipeline/pipelineRun';
export {
  addPackage,
  appRootOf,
  type LintConfigPlan,
  planSync,
  runnerSwitch,
  syncPlugin,
  writeDependencies,
  writeLintConfig,
} from './runs/sync/syncRun';
