import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Compass, Map, BookOpen, Target, Leaf } from 'lucide-react';

const guides = [
  {
    icon: <Compass size={24} aria-hidden="true" />,
    title: 'Getting Started Guide',
    description: 'New to EcoTrack? This guide walks you through account setup, first activity log, and understanding your carbon score.'
  },
  {
    icon: <Map size={24} aria-hidden="true" />,
    title: 'Tracking Guide',
    description: 'Learn best practices for accurately tracking various activities — from daily commute to weekly grocery shopping.'
  },
  {
    icon: <BookOpen size={24} aria-hidden="true" />,
    title: 'Sustainability Guide',
    description: 'A comprehensive overview of sustainable living practices, offset programs, and how to make a lasting impact.'
  },
  {
    icon: <Target size={24} aria-hidden="true" />,
    title: 'Goal Guide',
    description: 'Set meaningful carbon reduction targets, track your progress, and earn achievements along the way.'
  }
];

export const GuidesPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="guides-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Guides</span>
              </div>
              <h1 id="guides-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                Step-by-step <span style={{ color: 'var(--brand-primary)' }}>guides</span>
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
                Follow our detailed guides to make the most of EcoTrack and reduce your environmental impact.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              {guides.map((guide, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-gray-100)', transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--color-emerald-100)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--brand-primary)', marginBottom: 'var(--spacing-4)' }}>
                    {guide.icon}
                  </div>
                  <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>{guide.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{guide.description}</p>
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
