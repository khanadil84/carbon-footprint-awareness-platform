import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { FileText, List, AlertTriangle, Leaf } from 'lucide-react';

const sections = [
  {
    icon: <FileText size={24} aria-hidden="true" />,
    title: 'Terms of Service',
    description: 'The complete terms governing your use of EcoTrack. Includes account terms, payment terms, and service level agreements.'
  },
  {
    icon: <List size={24} aria-hidden="true" />,
    title: 'Usage Rules',
    description: 'Guidelines for acceptable use of the EcoTrack platform, including prohibited activities and content standards.'
  },
  {
    icon: <AlertTriangle size={24} aria-hidden="true" />,
    title: 'Limitations',
    description: 'Important limitations of liability, warranty disclaimers, and service availability terms that apply to your use of EcoTrack.'
  }
];

export const TermsPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="terms-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Terms</span>
              </div>
              <h1 id="terms-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                <span style={{ color: 'var(--brand-primary)' }}>Terms</span> of Service
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
                Please read these terms carefully before using the EcoTrack platform.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              {sections.map((item, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-gray-100)', transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--color-emerald-100)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--brand-primary)', marginBottom: 'var(--spacing-4)' }}>
                    {item.icon}
                  </div>
                  <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>{item.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
