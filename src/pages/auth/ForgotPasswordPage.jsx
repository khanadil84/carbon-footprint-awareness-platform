import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/mockAuthService';
import { validateEmail } from '../../utils/validation';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

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
            We've sent a password reset link to <strong>{email}</strong>.
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
        {error && (
          <div className="input-error-message" role="alert" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
            {error}
          </div>
        )}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
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
