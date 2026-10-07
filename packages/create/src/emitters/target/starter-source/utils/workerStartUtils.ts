import type { WorkerStart } from '@targets';

// Last, so it lands below any type a lint rule wants straight after the imports.
export const withWorkerStart = ({ imports = '', code }: WorkerStart) => {
  return (source: string): string => {
    const started = `${imports}${source}\n${code}\n`;

    return started;
  };
};
