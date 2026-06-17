import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Leaf, Newspaper, Lightbulb, Megaphone } from 'lucide-react';

const articles = [
  {
    icon: <Newspaper size={24} aria-hidden="true" />,
    category: 'Sustainability',
    title: 'Sustainability Articles',
    description: 'In-depth articles covering the latest trends, research, and news in sustainability and climate action.'
  },
  {
    icon: <Lightbulb size={24} aria-hidden="true" />,
    category: 'Tips',
    title: 'Carbon Reduction Tips',
    description: 'Practical, actionable tips you can implement today to reduce your carbon footprint and live more sustainably.'
  },
  {
    icon: <Megaphone size={24} aria-hidden="true" />,
    category: 'Updates',
    title: 'Product Updates',
    description: 'Stay informed about new features, improvements, and releases from the EcoTrack team.'
  }
];

export const BlogPage = () => {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <section aria-labelledby="blog-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto var(--spacing-12)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Blog</span>
              </div>
              <h1 id="blog-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                EcoTrack <span style={{ color: 'var(--brand-primary)' }}>Blog</span>
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)' }}>
                Insights, tips, and updates on sustainability and carbon footprint awareness.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
              {articles.map((article, i) => (
                <article key={i} style={{ backgroundColor: 'var(--bg-primary)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-gray-100)', transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--color-emerald-100)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--brand-primary)', marginBottom: 'var(--spacing-4)' }}>
                    {article.icon}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-primary)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>
                    {article.category}
                  </div>
                  <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>{article.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{article.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
