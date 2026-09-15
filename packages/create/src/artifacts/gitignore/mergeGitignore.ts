// Appended rather than written: the scaffolder's list knows about `.next/` and `.svelte-kit/`.

const LINTEL_IGNORED = ['coverage/', '*.tsbuildinfo'];

const HEADING = '# lintel';

export const mergeGitignore = (existing: string | null): string => {
  const current = existing ?? '';
  // Either line ending, or a Windows checkout's trailing `\r` gets the entry appended again.
  const lines = current.split(/\r?\n/);

  const missing = LINTEL_IGNORED.filter((entry) => {
    return !lines.includes(entry);
  });

  if (missing.length === 0) {
    return current;
  }

  const block = `${HEADING}\n${missing.join('\n')}\n`;

  if (current === '') {
    return block;
  }

  const terminated = current.endsWith('\n') ? current : `${current}\n`;

  return `${terminated}\n${block}`;
};
