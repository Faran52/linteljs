// The state word `hooks/checkStatusHook.ts` prints, which the check band draws.
export type CheckWord = 'failed' | 'none' | 'passed' | 'running' | 'stale';

// One loop's last prompt size, whether its last tool call saw it past each limit, and the wrap-up calls it has
// spent past the ceiling.
export interface ContextReading {
  tokens: number;
  isPastWarn: boolean;
  isPastCeiling: boolean;
  wrapUpCalls: number;
}

// Inline, since `claude plugin validate` reads the state's shape from this declaration.
declare module 'claude-code' {
  interface PluginState {
    linteljs: {
      check: CheckWord | null;
      context: StateFamily<ContextReading>;
    };
  }
}
