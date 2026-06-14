import { memo } from 'react';
import './Button.css';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClass = 'eco-button';
  const variantClass = `eco-button--${variant}`;
  const sizeClass = `eco-button--${size}`;

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default memo(Button);
