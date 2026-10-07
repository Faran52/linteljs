// The state word `hooks/checkStatusHook.ts` prints, which the check band draws.
export type CheckWord = 'failed' | 'none' | 'passed' | 'running' | 'stale';

// Inline, since `claude plugin validate` reads the state's shape from this declaration.
declare module 'claude-code' {
  interface PluginState {
    linteljs: { check: CheckWord | null };
  }
}
