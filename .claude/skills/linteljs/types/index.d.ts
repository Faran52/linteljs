// The state word `hooks/checkStatus.ts` prints, which the check band draws.
export type CheckWord = 'failed' | 'none' | 'passed' | 'running' | 'stale';

// What the CI band last read, and when, so a turn refreshes it at most every few minutes.
export interface CiBand {
  at: number;
  color: 'green' | 'red' | 'yellow';
  text: string;
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
