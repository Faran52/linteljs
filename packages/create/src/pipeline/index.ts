export type { PipelineOptions } from './runs/pipeline/pipelineRun';
export { pipelineRun } from './runs/pipeline/pipelineRun';
export {
  addProject,
  type LintConfigPlan,
  planRootDependencies,
  planSync,
  runnerSwitch,
  syncAgentFiles,
  type SyncPlan,
  type SyncProject,
  syncWorkspaceOf,
  writeDependencies,
  writeLintConfig,
} from './runs/sync/syncRun';
