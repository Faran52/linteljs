import type { FC, ReactNode } from 'react';

import './Button.css';

export type ButtonSize = keyof typeof classNames;

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
  readonly size?: ButtonSize;
}

const classNames = {
  md: 'button',
  lg: 'button button-lg',
};

export const Button: FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  size = 'md',
}) => {
  return (
    <button
      className={classNames[size]}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
