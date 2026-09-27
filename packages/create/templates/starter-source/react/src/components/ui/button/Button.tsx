import { styles } from './styles';

import type { FC, ReactNode } from 'react';

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
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
