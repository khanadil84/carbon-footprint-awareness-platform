import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Check, Leaf } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with carbon tracking.',
    features: ['Basic activity tracking', 'Monthly carbon reports', 'Community challenges', 'Email support'],
    cta: 'Get Started',
    to: '/signup',
    popular: false
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For individuals serious about reducing their impact.',
    features: ['Unlimited activity tracking', 'AI-powered recommendations', 'Detailed analytics & trends', 'Priority support', 'Export reports', 'Goal setting'],
    cta: 'Start Free Trial',
    to: '/signup',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'For teams and organizations tracking collective impact.',
    features: ['Everything in Pro', 'Team dashboard', 'Admin controls', 'API access', 'Dedicated account manager', 'Custom integrations'],
    cta: 'Contact Sales',
    to: '/signup',
    popular: false
  }
];

export const PricingPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="pricing-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Pricing</span>
              </div>
              <h1 id="pricing-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                Simple, transparent <span style={{ color: 'var(--brand-primary)' }}>pricing</span>
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
                Choose the plan that fits your sustainability journey. All plans include a 14-day free trial.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)', alignItems: 'start' }}>
              {plans.map((plan, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--bg-primary)',
                  padding: 'var(--spacing-8)',
                  borderRadius: 'var(--radius-xl)',
                  border: `2px solid ${plan.popular ? 'var(--brand-primary)' : 'var(--color-gray-100)'}`,
                  position: 'relative',
                  boxShadow: plan.popular ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--text-inverse)',
                      padding: 'var(--spacing-1) var(--spacing-4)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      Most Popular
                    </div>
                  )}
                  <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2)' }}>{plan.name}</h2>
                  <div style={{ marginBottom: 'var(--spacing-2)' }}>
                    <span style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>{plan.price}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{plan.period}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-6)' }}>{plan.description}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--spacing-8)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {plan.features.map((feat, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--text-secondary)' }}>
                        <Check size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} aria-hidden="true" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.to} style={{ textDecoration: 'none' }}>
                    <Button variant={plan.popular ? 'primary' : 'outline'} size="lg" style={{ width: '100%' }}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="comparison-heading" style={{ padding: 'var(--spacing-16) 0', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="container">
            <h2 id="comparison-heading" style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>Feature Comparison</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <th style={{ padding: 'var(--spacing-4)', textAlign: 'left', borderBottom: '1px solid var(--color-gray-200)', fontWeight: 'var(--font-weight-semibold)' }}>Feature</th>
                    <th style={{ padding: 'var(--spacing-4)', textAlign: 'center', borderBottom: '1px solid var(--color-gray-200)', fontWeight: 'var(--font-weight-semibold)' }}>Free</th>
                    <th style={{ padding: 'var(--spacing-4)', textAlign: 'center', borderBottom: '1px solid var(--color-gray-200)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--brand-primary)' }}>Pro</th>
                    <th style={{ padding: 'var(--spacing-4)', textAlign: 'center', borderBottom: '1px solid var(--color-gray-200)', fontWeight: 'var(--font-weight-semibold)' }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Activity Tracking', 'Basic', 'Unlimited', 'Unlimited'],
                    ['Carbon Reports', 'Monthly', 'Weekly', 'Real-time'],
                    ['AI Recommendations', false, true, true],
                    ['Team Dashboard', false, false, true],
                    ['API Access', false, false, true],
                    ['Priority Support', false, true, true],
                    ['Custom Integrations', false, false, true]
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                      <td style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 'var(--font-weight-medium)' }}>{row[0]}</td>
                      {[1, 2, 3].map(j => (
                        <td key={j} style={{ padding: 'var(--spacing-3) var(--spacing-4)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {row[j] === true ? <Check size={18} style={{ color: 'var(--brand-primary)', margin: '0 auto' }} aria-label="Included" /> :
                           row[j] === false ? <span aria-label="Not included" style={{ color: 'var(--color-gray-500)' }}>&mdash;</span> : row[j]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
