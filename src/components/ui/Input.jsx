import { forwardRef, memo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && (
          <div className="input-icon-wrapper" aria-hidden="true">
            <Icon className="input-icon" />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={inputType}
          className={`input-field ${Icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={togglePassword}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="input-error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default memo(Input);
