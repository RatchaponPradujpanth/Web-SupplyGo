import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  color = 'primary',
  size = 'medium',
  disabled = false,
}) => {
  const baseStyles = 'rounded-pill text-white font-medium transition';
  const colorStyles = {
    primary: 'bg-primary hover:bg-primary/80',
    secondary: 'bg-secondary hover:bg-secondary/80',
    accent: 'bg-accent hover:bg-accent/80',
  };
  const sizeStyles = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${colorStyles[color]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;