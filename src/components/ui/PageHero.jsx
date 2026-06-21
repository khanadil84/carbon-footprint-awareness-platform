import { Leaf } from 'lucide-react';

export const PageHero = ({ badgeText, headingId, headingBefore, headingHighlight, headingAfter, description, children }) => (
  <section aria-labelledby={headingId} style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
    <div className="container">
      <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
          <Leaf size={16} aria-hidden="true" />
          <span>{badgeText}</span>
        </div>
        <h1 id={headingId} style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
          {headingBefore}<span style={{ color: 'var(--brand-primary)' }}>{headingHighlight}</span>{headingAfter}
        </h1>
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      {children}
    </div>
  </section>
);
