import { useMemo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { useAuth } from '../../context/useAuth';
import { auth, checkPasswordStrength } from '../../domain/validation';

const PasswordStrengthIndicator = ({ password }) => {
  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);
  if (!password) return null;

  const ruleChecks = [
    { label: 'Min 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
    { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  ];

  return (
    <div style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Password Strength:</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: passwordStrength.color }}>{passwordStrength.label}</span>
      </div>
      <div style={{ height: '4px', display: 'flex', gap: '4px', borderRadius: '2px', overflow: 'hidden' }}>
        {[1, 2, 3, 4].map(level => (
          <div
            key={level}
            style={{
              flex: 1,
              backgroundColor: passwordStrength.score >= level ? passwordStrength.color : 'var(--color-gray-200)',
              transition: 'background-color 0.3s ease'
            }}
          />
        ))}
      </div>
      <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        {ruleChecks.map(rule => (
          <li key={rule.label} style={{ color: rule.test(password) ? 'var(--brand-primary)' : 'inherit' }}>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SignUpPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '', submit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
    setErrors(previous => {
      if (previous[name]) return { ...previous, [name]: '' };
      return previous;
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { name, email, errors: validationErrors, hasError } = auth.validateForm(formData);
    if (hasError) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({ name: '', email: '', password: '', submit: '' });

    try {
      await register(name, email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setErrors(previous => ({ ...previous, submit: error.message || 'Failed to create account' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start measuring and reducing your footprint today."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <ErrorBanner message={errors.submit} />

        <Input
          id="name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="Jane Doe"
          icon={User}
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          autoComplete="name"
          required
        />

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
          autoComplete="new-password"
          required
        />

        <PasswordStrengthIndicator password={formData.password} />

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="auth-redirect">
        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
};
