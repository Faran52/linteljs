// The state word `hooks/checkStatusHook.ts` prints, which the check band draws.
export type CheckWord = 'failed' | 'none' | 'passed' | 'running' | 'stale';

// A CI mark: a run or the Actions component passed (up), is running (degraded), or failed (down).
export type CiMark = 'failed' | 'passed' | 'running';

// What the CI band last read, and when, so a turn refreshes it at most every few minutes.
export interface CiBand {
  at: number;
  runs: [string, CiMark][];
  actions: CiMark | null;
}

// Inline, since `claude plugin validate` reads the state's shape from this declaration.
declare module 'claude-code' {
  interface PluginState {
    linteljs: {
      check: CheckWord | null;
      ci: CiBand | null;
    };
  }
}
