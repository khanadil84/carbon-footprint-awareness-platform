import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, checkPasswordStrength } from '../../utils/validation';

export const SignUpPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '', submit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const passwordStrength = checkPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    let hasError = false;
    const newErrors = { name: '', email: '', password: '', submit: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      hasError = true;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
      hasError = true;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
      hasError = true;
    } else if (passwordStrength.score < 4) {
      // Must meet all criteria
      newErrors.password = 'Password must meet all complexity requirements';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({ name: '', email: '', password: '', submit: '' });

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message || 'Failed to create account' }));
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
        {errors.submit && (
          <div className="input-error-message" role="alert" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
            {errors.submit}
          </div>
        )}

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
          placeholder="••••••••"
          icon={Lock}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        {/* Password Strength Indicator */}
        {formData.password && (
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
              <li style={{ color: formData.password.length >= 8 ? 'var(--brand-primary)' : 'inherit' }}>Min 8 characters</li>
              <li style={{ color: /[A-Z]/.test(formData.password) ? 'var(--brand-primary)' : 'inherit' }}>One uppercase letter</li>
              <li style={{ color: /[a-z]/.test(formData.password) ? 'var(--brand-primary)' : 'inherit' }}>One lowercase letter</li>
              <li style={{ color: /[0-9]/.test(formData.password) ? 'var(--brand-primary)' : 'inherit' }}>One number</li>
              <li style={{ color: /[^A-Za-z0-9]/.test(formData.password) ? 'var(--brand-primary)' : 'inherit' }}>One special character</li>
            </ul>
          </div>
        )}

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
