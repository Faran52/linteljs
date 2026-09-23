import { styles } from './styles';

import type { FC, ReactNode } from 'react';

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  // A form's submit is the one that is not a plain button; everything else presses and does something now.
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
}) => {
  return (
    <button
      {...styles.button}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
