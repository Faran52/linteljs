import { Index, type JSX } from 'solid-js';

import { styles } from './CodeText.styles';

export type CodeTone = keyof typeof styles;

export interface CodeTextProps {
  readonly text: string;
  readonly tone?: CodeTone;
}

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
export const CodeText = (props: CodeTextProps): JSX.Element => {
  const toneStyle = (): (typeof styles)[CodeTone] | undefined => {
    return props.tone === undefined ? undefined : styles[props.tone];
  };

  return (
    <span>
      <Index each={props.text.split(/<\/?code>/u)}>
        {(part, index) => {
          return index % 2 === 1 ? <code {...toneStyle()}>{part()}</code> : <>{part()}</>;
        }}
      </Index>
    </span>
  );
};
