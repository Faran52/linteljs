import { Index, type JSX } from 'solid-js';

export interface CodeTextProps {
  readonly text: string;
}

// A translation marks each command `<code>`: split here, so no message is rendered as HTML.
export const CodeText = (props: CodeTextProps): JSX.Element => {
  return (
    <span>
      <Index each={props.text.split(/<\/?code>/u)}>
        {(part, index) => {
          return index % 2 === 1 ? <code>{part()}</code> : <>{part()}</>;
        }}
      </Index>
    </span>
  );
};
