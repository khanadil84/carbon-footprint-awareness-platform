import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BookOpen, Globe, BarChart3, GraduationCap, Leaf } from 'lucide-react';

const resourceCategories = [
  {
    icon: <BookOpen size={24} aria-hidden="true" />,
    title: 'Documentation',
    description: 'Comprehensive guides and API documentation for developers and advanced users looking to integrate carbon tracking into their workflows.'
  },
  {
    icon: <Globe size={24} aria-hidden="true" />,
    title: 'Sustainability Resources',
    description: 'Curated articles, research papers, and tools to help you understand climate change and the importance of carbon footprint reduction.'
  },
  {
    icon: <BarChart3 size={24} aria-hidden="true" />,
    title: 'Carbon Tracking Resources',
    description: 'Learn about carbon accounting methodologies, emission factors, and best practices for accurate environmental impact measurement.'
  },
  {
    icon: <GraduationCap size={24} aria-hidden="true" />,
    title: 'Learning Materials',
    description: 'Interactive tutorials, webinars, and courses designed to deepen your knowledge of sustainable living and carbon management.'
  }
];

export const ResourcesPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="resources-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Resources</span>
              </div>
              <h1 id="resources-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                Explore our <span style={{ color: 'var(--brand-primary)' }}>resources</span>
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
                Everything you need to understand, track, and reduce your carbon footprint.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              {resourceCategories.map((item, i) => (
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
