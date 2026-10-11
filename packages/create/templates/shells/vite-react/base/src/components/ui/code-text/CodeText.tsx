import { type FC, Fragment } from 'react';

import { styles } from './CodeText.styles';

export type CodeTone = keyof typeof styles;

export interface CodeTextProps {
  readonly text: string;
  readonly tone?: CodeTone;
}

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
export const CodeText: FC<CodeTextProps> = ({ text, tone }) => {
  const parts = text.split(/<\/?code>/u);
  const toneStyle = tone === undefined ? undefined : styles[tone];

  return (
    <span>
      {parts
        .map((part, index) => {
          const key = `${String(index)}:${part}`;

          return index % 2 === 1 ? <code key={key} {...toneStyle}>{part}</code> : <Fragment key={key}>{part}</Fragment>;
        })}
    </span>
  );
};
