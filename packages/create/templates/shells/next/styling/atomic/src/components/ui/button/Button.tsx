import { styles } from './Button.styles';

import type { FC, ReactNode } from 'react';

export type ButtonSize = keyof typeof styles;

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
  readonly size?: ButtonSize;
}

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  size = 'md',
}) => {
  return (
    <button
      {...styles[size]}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
