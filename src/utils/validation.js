export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!re.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  return '';
};

export const checkPasswordStrength = (password) => {
  let score = 0;
  if (!password) return { score: 0, label: 'Weak', color: 'var(--color-gray-200)' };

  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLength) score += 1;
  if (hasLower && hasUpper) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  switch (score) {
    case 0:
    case 1:
      return { score, label: 'Weak', color: '#ef4444' }; // red-500
    case 2:
    case 3:
      return { score, label: 'Fair', color: '#eab308' }; // yellow-500
    case 4:
      return { score, label: 'Strong', color: 'var(--brand-primary)' }; // emerald-600
    default:
      return { score: 0, label: 'Weak', color: 'var(--color-gray-200)' };
  }
};
