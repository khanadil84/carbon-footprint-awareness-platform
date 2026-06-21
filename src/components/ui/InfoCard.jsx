import { memo } from 'react';

export const InfoCard = memo(({ icon, title, description, subtitle, headingTag: HeadingTag = 'h2', className = '', style, ...props }) => (
  <div
    className={className}
    style={{
      backgroundColor: 'var(--bg-primary)',
      padding: 'var(--spacing-8)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--color-gray-100)',
      transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
      ...style
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      e.currentTarget.style.borderColor = 'var(--color-emerald-100)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
      e.currentTarget.style.borderColor = '';
    }}
    {...props}
  >
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-emerald-100)', color: 'var(--brand-primary)',
      marginBottom: 'var(--spacing-4)'
    }}>
      {icon}
    </div>
    {subtitle && (
      <div style={{
        fontSize: 'var(--font-size-xs)', textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--brand-primary)',
        fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)'
      }}>
        {subtitle}
      </div>
    )}
    <HeadingTag style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>
      {title}
    </HeadingTag>
    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
  </div>
));
