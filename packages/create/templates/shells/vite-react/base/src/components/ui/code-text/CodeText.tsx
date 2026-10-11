import { type FC, Fragment } from 'react';

export interface CodeTextProps {
  readonly text: string;
}

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
export const CodeText: FC<CodeTextProps> = ({ text }) => {
  const parts = text.split(/<\/?code>/u);

  return (
    <span>
      {parts
        .map((part, index) => {
          const key = `${String(index)}:${part}`;

          return index % 2 === 1 ? <code key={key}>{part}</code> : <Fragment key={key}>{part}</Fragment>;
        })}
    </span>
  );
};
