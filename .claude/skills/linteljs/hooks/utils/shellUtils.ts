/**
 * Reads a Bash line as its simple commands, each a list of literal words and the heredoc fed to it. A word built
 * at run time (`$VAR`, any substitution but a quoted `$(cat <<'EOF' ... EOF)`) makes the line unreadable, and a
 * guard reading `undefined` lets the line pass: the classic git guard and the husky hooks still stand behind it.
 */
export interface ShellCommand {
  words: string[];
  stdin?: string;
}

interface HeredocToken {
  kind: 'heredoc';
  body: string;
}

interface MarkToken {
  kind: 'redirect' | 'separator';
}

interface WordToken {
  kind: 'word';
  text: string;
}

type Token = HeredocToken | MarkToken | WordToken;

type Read<Value> = [Value, number] | undefined;

const SEPARATOR = /^(?:&&|\|\||[;&|\n()])/u;
const REDIRECT = /^\d*(?:>>|>&\d+|<&\d+|&>|[<>])/u;
const REDIRECT_TO_FD = /&\d+$/u;
const HEREDOC = /^<<-?[ \t]*(['"]?)([\w.-]+)\1/u;
const CAT_HEREDOC = /^\$\(\s*cat\s+<<-?\s*(['"]?)([\w.-]+)\1/u;
const WORD_END = new Set([
  ' ',
  '\t',
  '\n',
  ';',
  '&',
  '|',
  '(',
  ')',
  '<',
  '>',
]);

// The heredoc body after the newline at `from`, and the index past its delimiter line.
const heredocBody = (line: string, from: number, delimiter: string): Read<string> => {
  const lines = line
    .slice(from + 1)
    .split('\n');
  const end = lines
    .findIndex((text) => {
      return text.trim() === delimiter;
    });

  if (end === -1) {
    return undefined;
  }

  const body = lines
    .slice(0, end)
    .join('\n');
  const through = lines
    .slice(0, end + 1)
    .join('\n');
  const read: Read<string> = [body, from + 1 + through.length];

  return read;
};

// A quoted `$(cat <<'EOF' ... EOF)`: its body, and its length. Bash ends it at the first delimiter line.
const catHeredoc = (text: string): Read<string> => {
  const head = CAT_HEREDOC.exec(text);
  const start = head === null ? 0 : text.indexOf('\n', head[0].length) + 1;

  if (head === null || start === 0) {
    return undefined;
  }

  const delimiter = head[2] ?? '';
  const closing = new RegExp(`\\n\\s*${delimiter.replaceAll('.', '\\.')}\\s*\\)`, 'u');
  const rest = text.slice(start);
  const close = closing.exec(rest);

  if (close === null) {
    return undefined;
  }

  const read: Read<string> = [rest.slice(0, close.index), start + close.index + close[0].length];

  return read;
};

// A double-quoted string read from just past its opening quote.
const doubleQuoted = (line: string, from: number): Read<string> => {
  let text = '';
  let index = from;

  while (index < line.length && line[index] !== '"') {
    const char = line[index] ?? '';
    const isSubstitution = char === '$' || char === '`';
    const substitution = isSubstitution ? catHeredoc(line.slice(index)) : undefined;

    if (isSubstitution && substitution === undefined) {
      return undefined;
    }

    if (substitution !== undefined) {
      text += substitution[0];
      index += substitution[1];
    }
    else if (char === '\\' && '"\\$`'.includes(line[index + 1] ?? '')) {
      text += line[index + 1] ?? '';
      index += 2;
    }
    else {
      text += char;
      index += 1;
    }
  }

  if (index >= line.length) {
    return undefined;
  }

  const read: Read<string> = [text, index + 1];

  return read;
};

// One quoted, escaped or bare piece of a word.
const wordPiece = (line: string, index: number): Read<string> => {
  const char = line[index] ?? '';

  if (char === '\'') {
    const close = line.indexOf('\'', index + 1);

    const read: Read<string> = close === -1 ? undefined : [line.slice(index + 1, close), close + 1];

    return read;
  }

  if (char === '"') {
    return doubleQuoted(line, index + 1);
  }

  if (char === '\\') {
    const escaped = line[index + 1] ?? '';
    const read: Read<string> = [escaped === '\n' ? '' : escaped, index + 2];

    return read;
  }

  const read: Read<string> = char === '$' || char === '`' ? undefined : [char, index + 1];

  return read;
};

const readWord = (line: string, from: number): Read<string> => {
  let text = '';
  let index = from;

  while (index < line.length && !WORD_END.has(line[index] ?? '')) {
    const piece = wordPiece(line, index);

    if (piece === undefined) {
      return undefined;
    }

    text += piece[0];
    [, index] = piece;
  }

  const read: Read<string> = [text, index];

  return read;
};

// Past a heredoc opener, redirect, separator, blank or comment at `index`, recording it; `undefined` at a word.
const pastMark = (line: string, index: number, tokens: Token[], pending: string[]): number | undefined => {
  const rest = line.slice(index);
  const heredoc = HEREDOC.exec(rest);
  const redirect = REDIRECT.exec(rest);
  const separator = SEPARATOR.exec(rest);

  if (heredoc !== null) {
    pending.push(heredoc[2] ?? '');

    return index + heredoc[0].length;
  }

  if (redirect !== null) {
    if (!REDIRECT_TO_FD.test(redirect[0])) {
      tokens.push({ kind: 'redirect' });
    }

    return index + redirect[0].length;
  }

  if (separator !== null) {
    tokens.push({ kind: 'separator' });

    return index + separator[0].length;
  }

  if (line[index] === ' ' || line[index] === '\t') {
    return index + 1;
  }

  if (line[index] !== '#') {
    return undefined;
  }

  const newline = line.indexOf('\n', index);

  return newline === -1 ? line.length : newline;
};

// The index past the next token, recording it; `undefined` when the line cannot be read.
const pastToken = (line: string, index: number, tokens: Token[], pending: string[]): number | undefined => {
  const [delimiter] = pending;

  if (line[index] === '\n' && delimiter !== undefined) {
    const body = heredocBody(line, index, delimiter);

    if (body === undefined) {
      return undefined;
    }

    pending.shift();
    tokens.push({ kind: 'heredoc', body: body[0] }, { kind: 'separator' });

    return body[1];
  }

  const marked = pastMark(line, index, tokens, pending);

  if (marked !== undefined) {
    return marked;
  }

  const word = readWord(line, index);

  if (word === undefined) {
    return undefined;
  }

  tokens.push({ kind: 'word', text: word[0] });

  return word[1];
};

const tokenize = (line: string): Token[] | undefined => {
  const tokens: Token[] = [];
  const pending: string[] = [];
  let index: number | undefined = 0;

  while (index !== undefined && index < line.length) {
    index = pastToken(line, index, tokens, pending);
  }

  return index === undefined || pending.length > 0 ? undefined : tokens;
};

export const shellCommands = (line: string): ShellCommand[] | undefined => {
  const tokens = tokenize(line);

  if (tokens === undefined) {
    return undefined;
  }

  const commands: ShellCommand[] = [];
  let current: ShellCommand = { words: [] };
  let isTarget = false;

  const ended: Token[] = [...tokens, { kind: 'separator' }];

  for (const token of ended) {
    if (token.kind === 'separator' && current.words.length > 0) {
      commands.push(current);
      current = { words: [] };
    }
    else if (token.kind === 'heredoc') {
      current.stdin = token.body;
    }
    else if (token.kind === 'word' && !isTarget) {
      current.words.push(token.text);
    }

    isTarget = token.kind === 'redirect';
  }

  return commands;
};
