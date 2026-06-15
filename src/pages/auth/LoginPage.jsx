import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/useAuth';
import { validateEmail, validatePassword, sanitizeString } from '../../domain/validation';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({ email: '', password: '', submit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setFormData(previous => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors(previous => {
      if (previous[name]) return { ...previous, [name]: '' };
      return previous;
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = sanitizeString(formData.email);
    const password = typeof formData.password === 'string' ? formData.password.trim() : formData.password;
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError, submit: '' });
      return;
    }

    setIsSubmitting(true);
    setErrors({ email: '', password: '', submit: '' });

    try {
      await login(email, password, formData.rememberMe);
      navigate('/dashboard');
    } catch (error) {
      setErrors(previous => ({ ...previous, submit: error.message || 'Failed to login' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your details to access your dashboard."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {errors.submit && (
          <div className="input-error-message" role="alert" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
            {errors.submit}
          </div>
        )}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          autoComplete="email"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          required
        />

        <div className="auth-form-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              id="rememberMe"
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              style={{ accentColor: 'var(--brand-primary)' }}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="auth-redirect">
        Don&apos;t have an account? <Link to="/signup" className="auth-link">Sign up</Link>
      </p>
    </AuthLayout>
  );
};
