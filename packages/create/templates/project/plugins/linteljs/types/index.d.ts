// The state word `hooks/checkStatus.ts` prints, which the check band draws.
export type CheckWord = 'failed' | 'none' | 'passed' | 'running' | 'stale';

export interface LinteljsState {
  check: CheckWord | null;
}

declare module 'claude-code' {
  interface PluginState {
    linteljs: LinteljsState;
  }
}
