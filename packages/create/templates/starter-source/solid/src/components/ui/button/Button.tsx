import { styles } from './styles';

import type { JSX } from 'solid-js';

export interface ButtonProps {
  readonly children: JSX.Element;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
}

// `props` is read rather than destructured, or each value would be read once and never again.
export const Button = (props: ButtonProps): JSX.Element => {
  return (
    <button
      {...styles.button}
      type={props.type ?? 'button'}
      disabled={props.disabled ?? false}
      onClick={() => {
        props.onClick?.();
      }}
    >
      {props.children}
    </button>
  );
};
