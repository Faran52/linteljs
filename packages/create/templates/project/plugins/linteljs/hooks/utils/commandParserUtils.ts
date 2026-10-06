// `undefined` means the command could not be read.
export type Dialect = 'bash' | 'powershell';

export interface ParsedCommand {
  tokens: [string, ...string[]];
  // Part of the command is computed where it runs (a PowerShell subexpression or `Start-Process`), so no guard can
  // vouch for what it is.
  opaque: boolean;
}

interface Segment {
  opaque: boolean;
  tokens: string[];
}

interface Heredoc {
  delimiter: string;
  literal: boolean;
  strip: boolean;
}

// What a group interrupted, restored when it closes.
interface Group extends Segment {
  active: boolean;
  body: Heredoc | undefined;
  closer: string;
  quote: string;
  token: string;
}

interface TokenizerState {
  active: boolean;
  body: Heredoc | undefined;
  dialect: Dialect;
  groups: Group[];
  heredocs: Heredoc[];
  opaque: boolean;
  quote: string;
  segments: Segment[];
  token: string;
  tokens: string[];
}

// The commands a wrapper runs itself, or the command a token that is no wrapper is. No commands means they could
// not be read.
interface NestedStep {
  commands?: ParsedCommand[] | undefined;
}

interface NextStep {
  index: number;
  opaque?: boolean;
  tokens?: string[];
}

type Step = NestedStep | NextStep;

type WrapperHandler = (tokens: string[], start: number, depth: number) => Step;

// Shells and wrappers nested past this are not read.
const MAX_DEPTH = 8;

// Stands in for the output of a bash command substitution inside a token.
export const COMPUTED = '\u0000';

// Words that open or close a bash compound command, after which the next command starts. A `case` pattern's `)`
// is not read: `case` bodies stay a known gap.
const RESERVED = new Set([
  '!',
  '{',
  '}',
  'if',
  'then',
  'else',
  'elif',
  'fi',
  'do',
  'done',
  'while',
  'until',
]);
const UNREADABLE: Step = {};
const NO_COMMAND: Step = { commands: [] };

// `C:\Git\cmd\git.exe` and `/usr/bin/git` are both `git`: Windows spells a binary with its extension.
export const commandName = (token: string): string => {
  const path = token.replaceAll('\\', '/');

  return path
    .slice(path.lastIndexOf('/') + 1)
    .toLowerCase()
    .replace(/\.(?:exe|cmd|bat)$/u, '');
};

export const skipOptions = (tokens: string[], start: number, valued: Set<string>): number | undefined => {
  let operand = false;

  for (const [offset, option] of tokens
    .slice(start)
    .entries()) {
    if (operand) {
      operand = false;
      continue;
    }

    if (option === '--') {
      return start + offset + 1;
    }

    if (!option.startsWith('-')) {
      return start + offset;
    }

    operand = valued.has(option);
  }

  return operand ? undefined : tokens.length;
};

const isAssignment = (token: string): boolean => {
  return /^[A-Za-z_]\w*=/u.test(token);
};

// The first index from `start` whose token is not skipped, or the end.
const indexAfter = (tokens: string[], start: number, skipped: (token: string) => boolean): number => {
  const offset = tokens
    .slice(start)
    .findIndex((token) => {
      return !skipped(token);
    });

  return offset === -1 ? tokens.length : start + offset;
};

const emitToken = (state: TokenizerState): void => {
  if (state.active) {
    state.tokens.push(state.token);
  }

  state.token = '';
  state.active = false;
};

const emitSegment = (state: TokenizerState): void => {
  emitToken(state);

  if (state.tokens.length > 0) {
    state.segments.push({
      opaque: state.opaque,
      tokens: state.tokens,
    });
  }

  state.tokens = [];
  state.opaque = false;
};

const pushGroup = (state: TokenizerState, closer: string, opaque: boolean): void => {
  state.groups.push({
    active: state.active,
    body: state.body,
    closer,
    opaque,
    quote: state.quote,
    token: state.token,
    tokens: state.tokens,
  });

  state.active = false;
  state.body = undefined;
  state.opaque = false;
  state.quote = '';
  state.token = '';
  state.tokens = [];
};

// A PowerShell group is read as the commands inside it, and the command it sits in cannot be vouched for.
const openGroup = (state: TokenizerState, closer: string): void => {
  emitToken(state);
  pushGroup(state, closer, true);
};

/**
 * A bash substitution is read as the commands inside it, and leaves COMPUTED in the token it sits in. Unquoted,
 * its output is split into words no guard can count, so that command cannot be vouched for either. A heredoc body
 * is no command's token, so one there leaves nothing.
 */
const openSubstitution = (state: TokenizerState, closer: string): void => {
  const inToken = state.body === undefined;
  const opaque = state.opaque || (inToken && state.quote === '');

  if (inToken) {
    state.token += COMPUTED;
    state.active = true;
  }

  pushGroup(state, closer, opaque);
};

// Opens the substitution at `$(` or a backtick, and answers the last character it consumed.
const substitute = (source: string, index: number, state: TokenizerState): number => {
  const backtick = source.charAt(index) === '`';

  openSubstitution(state, backtick ? '`' : ')');
  return backtick ? index : index + 1;
};

// Closes the innermost group, if `character` is what closes it.
const closeGroup = (state: TokenizerState, character: string): boolean => {
  const outer = state.groups.at(-1);

  if (outer?.closer !== character) {
    return false;
  }

  emitSegment(state);
  state.groups.pop();
  state.active = outer.active;
  state.body = outer.body;
  state.opaque = outer.opaque;
  state.quote = outer.quote;
  state.token = outer.token;
  state.tokens = outer.tokens;
  return true;
};

const escapeCharacter = (state: TokenizerState): string => {
  return state.dialect === 'bash' ? '\\' : '`';
};

// An escape that ends the source reads as nothing, and leaves the quote open.
const readQuotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);

  if (character === state.quote) {
    // PowerShell doubles a quote to escape it.
    if (state.dialect === 'powershell' && source[index + 1] === character) {
      state.token += character;
      return index + 1;
    }

    state.quote = '';
  }
  else if (character === escapeCharacter(state) && state.quote === '"') {
    index += 1;
    state.token += source.charAt(index);
  }
  else if (state.quote === '"' && (source.startsWith('$(', index) || character === '`')) {
    if (state.dialect === 'powershell') {
      return undefined;
    }

    return substitute(source, index, state);
  }
  else {
    state.token += character;
  }

  state.active = true;
  return index;
};

// An escaped line break continues the line, in bash by vanishing and in PowerShell as a space between tokens.
const readEscaped = (source: string, index: number, state: TokenizerState): number => {
  const pair = source.slice(index, index + 2);
  const lineBreak = /^(?:\r\n|\r|\n)/u.exec(pair)?.[0];

  if (lineBreak !== undefined) {
    if (state.dialect === 'powershell') {
      emitToken(state);
    }

    return index + lineBreak.length - 1;
  }

  state.token += source.charAt(index);
  state.active = true;
  return index;
};

const POWERSHELL_GROUP = /^(?:<#|@["'({]|\$\(|[(){}])/u;

// A here-string, a block comment and a closer that closes nothing open are not read.
const readPowerShellGroup = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);
  const pair = source.slice(index, index + 2);
  const opener = /^(?:[$@]\(|@\{|[({])/u.exec(pair)?.[0];

  if (opener !== undefined) {
    openGroup(state, opener.endsWith('(') ? ')' : '}');
    return index + opener.length - 1;
  }

  return closeGroup(state, character) ? index : undefined;
};

const readPlainCharacter = (source: string, index: number, state: TokenizerState): number => {
  const character = source.charAt(index);

  // The line break that ends a comment ends its command.
  if (character === '#' && !state.active) {
    const lineEnd = source.indexOf('\n', index);
    return lineEnd === -1 ? source.length : lineEnd - 1;
  }

  if (character === '\n') {
    emitSegment(state);
    state.body = state.heredocs.shift();
  }
  else if (/\s/u.test(character)) {
    emitToken(state);
  }
  else if (';|&'.includes(character)) {
    emitSegment(state);
  }
  else {
    state.token += character;
    state.active = true;
  }

  return index;
};

// `<<-'EOF'`, `<<"EOF"`, `<<\EOF` and `<<EOF`. A quoted delimiter makes the body literal.
const HEREDOC = /^<<(-?)[ \t]*(?:'([^'\n]*)'|"([^"\n]*)"|\\?([^\s"&'();<>`|]+))(?=[\s&;<>|)]|$)/u;

// The body is read from the line after the redirect, so it is queued until that line ends.
const readHeredoc = (source: string, index: number, state: TokenizerState): number | undefined => {
  const match = HEREDOC.exec(source.slice(index));

  if (match === null) {
    return undefined;
  }

  const [
    redirect,
    strip,
    single,
    double,
    bare,
  ] = match;

  emitToken(state);

  state.heredocs.push({
    delimiter: [
      single,
      double,
      bare,
    ].join(''),
    literal: bare === undefined || redirect.includes('\\'),
    strip: strip === '-',
  });

  return index + redirect.length - 1;
};

const readBashGroup = (source: string, index: number, state: TokenizerState): number | undefined => {
  const character = source.charAt(index);

  if (source.startsWith('<<<', index)) {
    state.token += '<<<';
    state.active = true;
    return index + 2;
  }

  if (source.startsWith('<<', index)) {
    return readHeredoc(source, index, state);
  }

  if (closeGroup(state, character)) {
    return index;
  }

  // A subshell opens only where no token is pending, so there is none to emit.
  if (character === '(') {
    pushGroup(state, ')', state.opaque);
    return index;
  }

  return substitute(source, index, state);
};

// `$(`, `<(`, `>(` and a backtick open a substitution, `(` a subshell where a command can start, and `)` closes
// only what is open, so a `case` pattern stays a character.
const isBashGroup = (source: string, index: number, state: TokenizerState): boolean => {
  const character = source.charAt(index);
  const pair = source.slice(index, index + 2);

  if (/^(?:[$<>]\(|<<|`)/u.test(pair)) {
    return true;
  }

  const closer = state.groups.at(-1)?.closer;
  return (character === '(' && !state.active) || (character === ')' && closer === ')');
};

const readUnquotedCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  const pair = source.slice(index, index + 2);

  if (state.dialect === 'powershell' && POWERSHELL_GROUP.test(pair)) {
    return readPowerShellGroup(source, index, state);
  }

  if (state.dialect === 'bash' && isBashGroup(source, index, state)) {
    return readBashGroup(source, index, state);
  }

  const character = source.charAt(index);

  if (character === '"' || character === "'") {
    state.quote = character;
    return index;
  }

  if (character === escapeCharacter(state)) {
    return index + 1 < source.length ? readEscaped(source, index + 1, state) : undefined;
  }

  return readPlainCharacter(source, index, state);
};

// A body line is skipped whole when it is literal or the delimiter, and read for substitutions otherwise.
const readBody = (source: string, index: number, state: TokenizerState, body: Heredoc): number => {
  if (source[index - 1] === '\n') {
    const lineEnd = source.indexOf('\n', index);
    const end = lineEnd === -1 ? source.length : lineEnd;
    const line = source
      .slice(index, end)
      .replace(body.strip ? /^\t+/u : /^/u, '')
      .replace(/\r$/u, '');

    if (line === body.delimiter) {
      state.body = state.heredocs.shift();
      return end;
    }

    if (body.literal) {
      return end;
    }
  }

  const character = source.charAt(index);

  if (character === '\\') {
    return index + 1;
  }

  if (character === '`' || source.startsWith('$(', index)) {
    return substitute(source, index, state);
  }

  return index;
};

const readCharacter = (source: string, index: number, state: TokenizerState): number | undefined => {
  if (state.body !== undefined) {
    return readBody(source, index, state, state.body);
  }

  return state.quote === ''
    ? readUnquotedCharacter(source, index, state)
    : readQuotedCharacter(source, index, state);
};

// Each read answers the last character it consumed. The walk visits each index once, so it always ends.
const segmentsOf = (source: string, dialect: Dialect): Segment[] | undefined => {
  const state: TokenizerState = {
    active: false,
    body: undefined,
    dialect,
    groups: [],
    heredocs: [],
    opaque: false,
    quote: '',
    segments: [],
    token: '',
    tokens: [],
  };

  let resume = 0;

  for (const index of source
    .split('')
    .keys()) {
    if (index >= resume) {
      const consumed = readCharacter(source, index, state);

      if (consumed === undefined) {
        return undefined;
      }

      resume = consumed + 1;
    }
  }

  if (state.quote !== '' || state.groups.length > 0) {
    return undefined;
  }

  emitSegment(state);
  return state.segments;
};

const next = (index: number): Step => {
  const step: Step = { index };

  return step;
};

// A split string is one command: none at all, or several, is not something env would run as this one.
const splitEnvArguments = (splitString: string, trailing: string[]): string[] | undefined => {
  const [first, ...rest] = segmentsOf(splitString, 'bash') ?? [];

  if (first === undefined || rest.length > 0 || first.opaque) {
    return undefined;
  }

  const splitArguments = [...first.tokens, ...trailing];

  return splitArguments;
};

// The split words are read as a command env runs.
const envCommand = (words: string[]): Step => {
  const step: Step = {
    index: 0,
    tokens: ['env', ...words],
  };

  return step;
};

const ENV_VALUED = new Set([
  '-u',
  '--unset',
  '-C',
  '--chdir',
  '-a',
  '--argv0',
  '-P',
]);
const ENV_FLAGS = new Set([
  '-',
  '-0',
  '--null',
  '-i',
  '--ignore-environment',
  '-v',
  '--debug',
]);
const JOINED_SPLIT = /^(?:-S|--split-string=)(.*)/su;

// `-S` splits its operand into the command env runs, so that is read again as an env command, one level deeper.
const envSplit = (tokens: string[], index: number, option: string): Step | undefined => {
  const separate = option === '-S' || option === '--split-string';
  const splitString = separate ? tokens[index + 1] : JOINED_SPLIT.exec(option)?.[1];

  if (splitString === undefined) {
    return undefined;
  }

  const words = splitEnvArguments(splitString, tokens.slice(index + (separate ? 2 : 1)));
  return words === undefined ? UNREADABLE : envCommand(words);
};

const isEnvOption = (option: string): boolean => {
  return ENV_VALUED.has(option) || ENV_FLAGS.has(option) || option.startsWith('-P');
};

// An option env does not know might take an operand, so the command cannot be found.
const envWrapper = (tokens: string[], start: number): Step => {
  let operand = false;

  for (const [offset, option] of tokens
    .slice(start)
    .entries()) {
    const index = start + offset;

    if (operand) {
      operand = false;
      continue;
    }

    if (option === '--' || !option.startsWith('-')) {
      const commandIndex = indexAfter(tokens, option === '--' ? index + 1 : index, isAssignment);
      return next(commandIndex);
    }

    const split = envSplit(tokens, index, option);

    if (split !== undefined) {
      return split;
    }

    if (!isEnvOption(option)) {
      return UNREADABLE;
    }

    operand = ENV_VALUED.has(option);
  }

  return operand ? UNREADABLE : NO_COMMAND;
};

// `command -v` looks a name up rather than running it.
const commandWrapper = (tokens: string[], start: number): Step => {
  const commandIndex = indexAfter(tokens, start, (option) => {
    return option.startsWith('-') && option !== '--';
  });

  const isLookup = tokens
    .slice(start, commandIndex)
    .some((option) => {
      return /v/iu.test(option);
    });

  if (isLookup) {
    return NO_COMMAND;
  }

  return next(tokens[commandIndex] === '--' ? commandIndex + 1 : commandIndex);
};

const optionWrapper = (tokens: string[], start: number, valued: Set<string>): Step => {
  const index = skipOptions(tokens, start, valued);

  if (index === undefined) {
    return UNREADABLE;
  }

  const commandIndex = indexAfter(tokens, index, isAssignment);
  return next(commandIndex);
};

const nested = (source: string, dialect: Dialect, depth: number): Step => {
  const step: Step = {
    commands: commandsIn(source, dialect, depth + 1),
  };

  return step;
};

const shellWrapper = (tokens: string[], start: number, depth: number): Step => {
  const rest = tokens.slice(start);

  for (const [index, option] of rest.entries()) {
    if (/^-[^-]*c/u.test(option)) {
      const command = rest[index + 1];
      return command === undefined ? UNREADABLE : nested(command, 'bash', depth);
    }

    if (!option.startsWith('-')) {
      break;
    }
  }

  return NO_COMMAND;
};

const POWERSHELL_VALUED = new Set([
  '-configurationname',
  '-custompipename',
  '-executionpolicy',
  '-ex',
  '-ep',
  '-inputformat',
  '-outputformat',
  '-settingsfile',
  '-windowstyle',
  '-workingdirectory',
  '-wd',
  '-version',
]);

// `-c`, `-com` and `-Command` alike: PowerShell accepts any prefix of a parameter name.
const isPrefixOf = (option: string, name: string): boolean => {
  return option.length > 1 && name.startsWith(option);
};

// A PowerShell host reads everything after `-Command` as the command; an encoded one cannot be read at all.
const powerShellWrapper = (tokens: string[], start: number, depth: number): Step => {
  let operand = false;

  for (const [offset, token] of tokens
    .slice(start)
    .entries()) {
    const option = token.toLowerCase();
    const index = start + offset;

    if (operand) {
      operand = false;
      continue;
    }

    if (!option.startsWith('-')) {
      const command = tokens
        .slice(index)
        .join(' ');
      return nested(command, 'powershell', depth);
    }

    if (isPrefixOf(option, '-command')) {
      const command = tokens
        .slice(index + 1)
        .join(' ');
      return nested(command, 'powershell', depth);
    }

    if (isPrefixOf(option, '-encodedcommand') || option === '-ec') {
      return UNREADABLE;
    }

    if (isPrefixOf(option, '-file')) {
      return NO_COMMAND;
    }

    operand = POWERSHELL_VALUED.has(option);
  }

  return NO_COMMAND;
};

const cmdWrapper = (tokens: string[], start: number, depth: number): Step => {
  const rest = tokens.slice(start);

  for (const [index, token] of rest.entries()) {
    const option = token.toLowerCase();

    if (option === '/c' || option === '/k') {
      const command = rest
        .slice(index + 1)
        .join(' ');
      return nested(command, 'powershell', depth);
    }

    if (!option.startsWith('/')) {
      break;
    }
  }

  return NO_COMMAND;
};

const START_PROCESS_VALUED = new Set([
  '-argumentlist',
  '-args',
  '-credential',
  '-redirectstandarderror',
  '-redirectstandardinput',
  '-redirectstandardoutput',
  '-verb',
  '-windowstyle',
  '-workingdirectory',
]);

// The program is the first word no option takes, but its arguments arrive as a PowerShell array, so the command
// is opaque.
const startProcessWrapper = (tokens: string[], start: number): Step => {
  const lowered = tokens
    .map((token) => {
      return token.toLowerCase();
    });
  const index = skipOptions(lowered, start, START_PROCESS_VALUED);

  if (index === undefined) {
    return UNREADABLE;
  }

  const step: Step = {
    index,
    opaque: true,
  };

  return step;
};

const EXEC_VALUED = new Set(['-a', '--argv0']);
const SUDO_VALUED = new Set([
  '-u',
  '--user',
  '-g',
  '--group',
  '-h',
  '--host',
  '-p',
  '--prompt',
  '-C',
  '--close-from',
  '-r',
  '--role',
  '-t',
  '--type',
]);
const TIME_VALUED = new Set([
  '-f',
  '--format',
  '-o',
  '--output',
]);
const SHELLS = new Set([
  'sh',
  'bash',
  'zsh',
  'dash',
  'ksh',
]);

const nohupWrapper: WrapperHandler = (tokens, start) => {
  return next(tokens[start] === '--' ? start + 1 : start);
};

const invokeExpressionWrapper: WrapperHandler = (tokens, start, depth) => {
  const from = tokens[start]?.toLowerCase() === '-command' ? start + 1 : start;
  const command = tokens
    .slice(from)
    .join(' ');

  return nested(command, 'powershell', depth);
};

const optionWrapperOf = (valued: Set<string>): WrapperHandler => {
  return (tokens, start) => {
    return optionWrapper(tokens, start, valued);
  };
};

const shellEntries = [...SHELLS]
  .map((shell) => {
    const entry: [string, WrapperHandler] = [shell, shellWrapper];

    return entry;
  });

const WRAPPERS = new Map<string, WrapperHandler>([
  ['env', envWrapper],
  ['command', commandWrapper],
  ['exec', optionWrapperOf(EXEC_VALUED)],
  ['nohup', nohupWrapper],
  ['sudo', optionWrapperOf(SUDO_VALUED)],
  ['time', optionWrapperOf(TIME_VALUED)],
  ...shellEntries,
  ['pwsh', powerShellWrapper],
  ['powershell', powerShellWrapper],
  ['cmd', cmdWrapper],
  ['iex', invokeExpressionWrapper],
  ['invoke-expression', invokeExpressionWrapper],
  ['start-process', startProcessWrapper],
  ['saps', startProcessWrapper],
  ['start', startProcessWrapper],
]);

// A token that is no wrapper is the command itself.
const wrapperStep = (tokens: string[], index: number, token: string, depth: number, opaque: boolean): Step => {
  const wrapper = WRAPPERS.get(commandName(token));

  if (wrapper !== undefined) {
    return wrapper(tokens, index + 1, depth);
  }

  const command: Step = {
    commands: [{
      tokens: [token, ...tokens.slice(index + 1)],
      opaque,
    }],
  };

  return command;
};

// Each wrapper is one level deeper, so a chain of them ends at the depth limit.
const unwrap = (tokens: string[], index: number, opaque: boolean, depth: number): ParsedCommand[] | undefined => {
  const token = tokens[index];

  if (depth > MAX_DEPTH) {
    return undefined;
  }

  if (token === undefined) {
    return [];
  }

  const step = wrapperStep(tokens, index, token, depth, opaque);

  if ('index' in step) {
    return unwrap(step.tokens ?? tokens, step.index, opaque || step.opaque === true, depth + 1);
  }

  return step.commands;
};

const isPrefixWord = (token: string): boolean => {
  return RESERVED.has(token) || isAssignment(token);
};

const commandsIn = (source: string, dialect: Dialect, depth: number): ParsedCommand[] | undefined => {
  const segments = segmentsOf(source, dialect);

  if (segments === undefined) {
    return undefined;
  }

  const commands: ParsedCommand[] = [];

  for (const { tokens, opaque } of segments) {
    const unwrapped = unwrap(tokens, indexAfter(tokens, 0, isPrefixWord), opaque, depth);

    if (unwrapped === undefined) {
      return undefined;
    }

    commands.push(...unwrapped);
  }

  return commands;
};

export const parseCommand = (source: string, dialect: Dialect): ParsedCommand[] | undefined => {
  return commandsIn(source, dialect, 0);
};
