import { type FC, Fragment } from 'react';

import './CodeText.css';

export type CodeTone = keyof typeof classNames;

export interface CodeTextProps {
  readonly text: string;
  readonly tone?: CodeTone;
}

const classNames = {
  primary: 'code-primary',
};

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
export const CodeText: FC<CodeTextProps> = ({ text, tone }) => {
  const parts = text.split(/<\/?code>/u);
  const toneStyle = tone === undefined ? undefined : classNames[tone];

  return (
    <span>
      {parts
        .map((part, index) => {
          const key = `${String(index)}:${part}`;

          return index % 2 === 1
            ? <code key={key} className={toneStyle}>{part}</code>
            : <Fragment key={key}>{part}</Fragment>;
        })}
    </span>
  );
};
