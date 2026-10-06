// What the repo guards decide, kept apart from the engine so each answer is a plain function of its input.
import type { ShellCommand } from './shellUtils.ts';

export interface CommitCommand {
  dir: string;
  args: string[];
  stdin?: string;
}

export interface CommitMessage {
  text?: string;
  file?: string;
}

const LIVE = new Set(['pending', 'running', 'waiting']);

const READERS = new Set(['awk', 'bat', 'cat', 'head', 'less', 'more', 'sed', 'tail']);

const UNREADABLE: [RegExp, string][] = [
  [/(?:^|\/)pnpm-lock\.yaml$/u, 'the lockfile'],
  [/(?:^|\/)node_modules\//u, 'installed package code'],
  [/(?:^|\/)coverage\//u, 'coverage output'],
  [/\.jsonl$/u, 'a Claude transcript'],
  [/\.output$/u, 'a task\'s output file'],
];

const POLL_LOOP = /\b(?:while|until)\b[\s\S]*?\bdo\b[\s\S]*?\bsleep\b/u;
const WATCH = /(?:^|[\s;&|(])watch\s/u;

const IGNORE_COMMENT = /\/[*/]\s*(?:(?:istanbul|[vc]8)\s+ignore|Stryker\s+disable)\b/giu;
const URL_HOST = /https?:\/\/([\w.-]+)/giu;
const MIRROR_HOST = /npmmirror|registry/iu;

// Files that hold the ignore comments as data: suites, fixtures, prose and the shipped template text.
const COMMENT_DATA = /\.test\.tsx?$|\/__mocks__\/|\.md$|(?:^|\/)templates\//u;

const GIT_VALUED = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);
const MESSAGE_FLAGS = new Set(['-m', '--message']);
const FILE_FLAGS = new Set(['-F', '--file']);

const baseName = (path: string): string => {
  return path.slice(path.lastIndexOf('/') + 1);
};

export const resolvedPath = (base: string, path: string): string => {
  return path.startsWith('/') ? path : `${base}/${path}`;
};

export const readReason = (path: string): string | undefined => {
  const found = UNREADABLE.find(([pattern]) => {
    return pattern.test(path);
  });

  return found === undefined
    ? undefined
    : `linteljs: ${path} is ${found[1]}, too large or too noisy to read whole. Grep it for what you need, `
      + 'or use the targeted tool (`pnpm why`, the test runner\'s own output, a filtered `jq`).';
};

export const shellReadReason = (commands: ShellCommand[]): string | undefined => {
  const paths = commands
    .filter(({ words }) => {
      return READERS.has(baseName(words[0] ?? ''));
    })
    .flatMap(({ words }) => {
      return words.slice(1);
    });

  return paths
    .map(readReason)
    .find((reason) => {
      return reason !== undefined;
    });
};

export const POLL_REASON = 'linteljs: a subagent does not poll. Run the command once, or with run_in_background '
  + 'and end the turn: its completion wakes you. No sleep loops, no `watch`, no Monitor.';

export const pollReason = (command: string): string | undefined => {
  return POLL_LOOP.test(command) || WATCH.test(command) ? POLL_REASON : undefined;
};

const countOf = (pattern: RegExp, text: string): number => {
  return text.match(pattern)?.length ?? 0;
};

const mirrorsIn = (text: string): string[] => {
  return [...text.matchAll(URL_HOST)]
    .map(([, host = '']) => {
      return host.toLowerCase();
    })
    .filter((host) => {
      return MIRROR_HOST.test(host) && host !== 'registry.npmjs.org';
    });
};

// What an edit adds that the repo bans: a registry other than npmjs, a coverage ignore or a Stryker disable.
export const addedBans = (path: string, before: string, after: string): string[] => {
  const known = new Set(mirrorsIn(before));
  const mirrors = [...new Set(mirrorsIn(after))].filter((host) => {
    return !known.has(host);
  });
  const isData = COMMENT_DATA.test(path);
  const comments = !isData && countOf(IGNORE_COMMENT, after) > countOf(IGNORE_COMMENT, before);

  return [
    ...mirrors.map((host) => {
      return `a registry other than registry.npmjs.org (${host})`;
    }),
    ...(comments ? ['a coverage ignore or Stryker disable comment'] : []),
  ];
};

export const bansReason = (path: string, bans: string[]): string | undefined => {
  return bans.length === 0
    ? undefined
    : `linteljs: ${path} would gain ${bans.join(' and ')}. The repo commits only registry.npmjs.org `
      + '(set a mirror in the environment, never in a file), and survivors and uncovered lines are fixed, never ignored.';
};

// Each file's added lines in a `git diff -U0`, by the path after `+++ b/`.
export const addedLines = (diff: string): Map<string, string> => {
  const added = new Map<string, string>();
  let path = '';

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      path = line.slice(line.indexOf('/') + 1);
    } else if (line.startsWith('+')) {
      added.set(path, `${added.get(path) ?? ''}${line.slice(1)}\n`);
    }
  }

  return added;
};

export const isTmpScript = (name: string): boolean => {
  return name.endsWith('.tmp.ts');
};

const gitCommit = (words: string[], base: string): CommitCommand | undefined => {
  let dir = base;
  let index = 1;

  while (words[index]?.startsWith('-') === true) {
    const option = words[index] ?? '';
    const value = words[index + 1] ?? '';
    dir = option === '-C' ? resolvedPath(dir, value) : dir;
    index += GIT_VALUED.has(option) ? 2 : 1;
  }

  return baseName(words[0] ?? '') === 'git' && words[index] === 'commit'
    ? { dir, args: words.slice(index + 1) }
    : undefined;
};

// The commits a line runs, each in the directory a leading `cd` or `git -C` moves it to.
export const commitsIn = (commands: ShellCommand[], cwd: string): CommitCommand[] => {
  let base = cwd;
  const commits: CommitCommand[] = [];

  for (const { words, stdin } of commands) {
    const commit = gitCommit(words, base);

    if (words[0] === 'cd' && words[1] !== undefined) {
      base = resolvedPath(base, words[1]);
    } else if (commit !== undefined) {
      commits.push(stdin === undefined ? commit : { ...commit, stdin });
    }
  }

  return commits;
};

// One option's value: the rest of a short cluster (`-mfix`, `-am fix`), after `=`, or the next word.
const optionValue = (args: string[], index: number, flag: string): string | undefined => {
  const word = args[index] ?? '';
  const attached = word.startsWith('--') ? word.slice(flag.length + 1) : word.slice(word.indexOf(flag[1] ?? '') + 1);

  return attached === '' ? args[index + 1] : attached;
};

const flagOf = (word: string): string | undefined => {
  const long = word.split('=')[0] ?? '';

  if (word.startsWith('--')) {
    return MESSAGE_FLAGS.has(long) || FILE_FLAGS.has(long) ? long : undefined;
  }

  const short = /^-[a-zA-Z]*?([mF])/u.exec(word);

  return short === null ? undefined : `-${short[1] ?? ''}`;
};

// The message a commit's `-m`s spell (paragraphs, as git joins them), or the file its `-F` names.
export const commitMessage = (args: string[]): CommitMessage => {
  const messages: string[] = [];
  let file: string | undefined;

  args.forEach((word, index) => {
    const flag = flagOf(word);
    const value = flag === undefined ? undefined : optionValue(args, index, flag);

    if (flag !== undefined && MESSAGE_FLAGS.has(flag) && value !== undefined) {
      messages.push(value);
    } else if (flag !== undefined && FILE_FLAGS.has(flag)) {
      file = value;
    }
  });

  return messages.length > 0 ? { text: messages.join('\n\n') } : { ...(file === undefined ? {} : { file }) };
};

// Worktrees no live agent of this session owns; the harness names each `agent-<id>`.
export const leftoverNote = (names: string[], agents: { id: string; status: string }[]): string | undefined => {
  const live = new Set(agents
    .filter(({ status }) => {
      return LIVE.has(status);
    })
    .map(({ id }) => {
      return `agent-${id}`;
    }));
  const leftover = names.filter((name) => {
    return !live.has(name);
  });

  return leftover.length === 0
    ? undefined
    : `linteljs: worktrees no running agent owns sit under .claude/worktrees: ${leftover.join(', ')}. `
      + 'Merge or drop what each holds, then `git worktree remove` it.';
};
