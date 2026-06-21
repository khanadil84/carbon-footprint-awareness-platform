import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { authService } from '../../services/mockAuthService';
import { validateEmail } from '../../domain/validation';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authService.resetPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Check your email">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: 'var(--color-emerald-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
            <CheckCircle aria-hidden="true" />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link to="/login" style={{ width: '100%' }}>
            <Button variant="primary" className="auth-submit-btn">Return to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <ErrorBanner message={error} />

        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          icon={Mail}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError('');
          }}
          error={error}
          autoComplete="email"
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending link...' : 'Send reset link'}
        </Button>
      </form>

      <p className="auth-redirect">
        Remember your password? <Link to="/login" className="auth-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
};
