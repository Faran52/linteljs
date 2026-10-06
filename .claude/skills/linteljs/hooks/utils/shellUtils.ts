// Reads a Bash line as its simple commands, each a list of literal words and the heredoc fed to it. A word built
// at run time (`$VAR`, any substitution but a quoted `$(cat <<'EOF' ... EOF)`) makes the line unreadable, and a
// guard reading `undefined` lets the line pass: the classic git guard and the husky hooks still stand behind it.
export interface ShellCommand {
  words: string[];
  stdin?: string;
}

type Token = { kind: 'heredoc'; body: string } | { kind: 'redirect' } | { kind: 'separator' } | { kind: 'word'; text: string };

type Read<Value> = [Value, number] | undefined;

const SEPARATOR = /^(?:&&|\|\||[;&|\n()])/u;
const REDIRECT = /^\d*(?:>>|>&\d+|<&\d+|&>|[<>])/u;
const REDIRECT_TO_FD = /&\d+$/u;
const HEREDOC = /^<<-?[ \t]*(['"]?)([\w.-]+)\1/u;
const CAT_HEREDOC = /^\$\(\s*cat\s+<<-?\s*(['"]?)([\w.-]+)\1[^\n]*\n([\s\S]*?)\n\s*\2\s*\n?\s*\)/u;
const WORD_END = new Set([' ', '\t', '\n', ';', '&', '|', '(', ')', '<', '>']);

// The heredoc body after the newline at `from`, and the index past its delimiter line.
const heredocBody = (line: string, from: number, delimiter: string): Read<string> => {
  const lines = line.slice(from + 1).split('\n');
  const end = lines.findIndex((text) => {
    return text.trim() === delimiter;
  });

  return end === -1
    ? undefined
    : [lines.slice(0, end).join('\n'), from + 1 + lines.slice(0, end + 1).join('\n').length];
};

// A double-quoted string read from just past its opening quote.
const doubleQuoted = (line: string, from: number): Read<string> => {
  let text = '';
  let index = from;

  while (index < line.length && line[index] !== '"') {
    const char = line[index] ?? '';
    const substitution = char === '$' || char === '`' ? CAT_HEREDOC.exec(line.slice(index)) : undefined;

    if (substitution === null) {
      return undefined;
    }

    if (substitution !== undefined) {
      text += substitution[3] ?? '';
      index += substitution[0].length;
    } else if (char === '\\' && '"\\$`'.includes(line[index + 1] ?? '')) {
      text += line[index + 1] ?? '';
      index += 2;
    } else {
      text += char;
      index += 1;
    }
  }

  return index < line.length ? [text, index + 1] : undefined;
};

// One quoted, escaped or bare piece of a word.
const wordPiece = (line: string, index: number): Read<string> => {
  const char = line[index] ?? '';

  if (char === '\'') {
    const close = line.indexOf('\'', index + 1);

    return close === -1 ? undefined : [line.slice(index + 1, close), close + 1];
  }

  if (char === '"') {
    return doubleQuoted(line, index + 1);
  }

  if (char === '\\') {
    return [line[index + 1] === '\n' ? '' : (line[index + 1] ?? ''), index + 2];
  }

  return char === '$' || char === '`' ? undefined : [char, index + 1];
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

  return [text, index];
};

const tokenize = (line: string): Token[] | undefined => {
  const tokens: Token[] = [];
  const pending: string[] = [];
  let index = 0;

  while (index < line.length) {
    const rest = line.slice(index);
    const heredoc = HEREDOC.exec(rest);
    const redirect = heredoc === null ? REDIRECT.exec(rest) : null;
    const separator = SEPARATOR.exec(rest);
    const [delimiter] = pending;

    if (line[index] === '\n' && delimiter !== undefined) {
      const body = heredocBody(line, index, delimiter);

      if (body === undefined) {
        return undefined;
      }

      pending.shift();
      tokens.push({ kind: 'heredoc', body: body[0] }, { kind: 'separator' });
      [, index] = body;
    } else if (heredoc !== null) {
      pending.push(heredoc[2] ?? '');
      index += heredoc[0].length;
    } else if (redirect !== null) {
      if (!REDIRECT_TO_FD.test(redirect[0])) {
        tokens.push({ kind: 'redirect' });
      }

      index += redirect[0].length;
    } else if (separator !== null) {
      tokens.push({ kind: 'separator' });
      index += separator[0].length;
    } else if (line[index] === ' ' || line[index] === '\t') {
      index += 1;
    } else if (line[index] === '#') {
      const newline = line.indexOf('\n', index);
      index = newline === -1 ? line.length : newline;
    } else {
      const word = readWord(line, index);

      if (word === undefined) {
        return undefined;
      }

      tokens.push({ kind: 'word', text: word[0] });
      [, index] = word;
    }
  }

  return pending.length > 0 ? undefined : tokens;
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
    } else if (token.kind === 'heredoc') {
      current.stdin = token.body;
    } else if (token.kind === 'word' && !isTarget) {
      current.words.push(token.text);
    }

    isTarget = token.kind === 'redirect';
  }

  return commands;
};
