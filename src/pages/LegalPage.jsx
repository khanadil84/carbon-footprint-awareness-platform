import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Scale, Info, ShieldCheck, Leaf } from 'lucide-react';

const sections = [
  {
    icon: <Scale size={24} aria-hidden="true" />,
    title: 'Legal Information',
    description: 'General legal information about EcoTrack, including company details, terms of engagement, and jurisdictional notices.'
  },
  {
    icon: <Info size={24} aria-hidden="true" />,
    title: 'Disclaimer',
    description: 'Important disclaimers regarding carbon footprint calculations, data accuracy, and the informational nature of our services.'
  },
  {
    icon: <ShieldCheck size={24} aria-hidden="true" />,
    title: 'User Responsibilities',
    description: 'Guidelines for acceptable use, data accuracy responsibilities, and community standards for all EcoTrack users.'
  }
];

export const LegalPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="legal-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Legal</span>
              </div>
              <h1 id="legal-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                <span style={{ color: 'var(--brand-primary)' }}>Legal</span> Information
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
                Important legal documents and information regarding the use of EcoTrack.
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
