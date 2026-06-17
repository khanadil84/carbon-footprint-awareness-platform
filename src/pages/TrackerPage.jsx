import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, Activity, BarChart3, Target, Leaf } from 'lucide-react';

export const TrackerPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main id="main-content">
        <section className="hero" aria-labelledby="tracker-heading" style={{ padding: 'var(--spacing-16) 0', background: 'linear-gradient(to bottom, var(--bg-tertiary) 0%, var(--bg-primary) 100%)' }}>
          <div className="container">
            <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--color-emerald-700)', padding: 'var(--spacing-1) var(--spacing-3)', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
                <Leaf size={16} aria-hidden="true" />
                <span>Start your journey</span>
              </div>
              <h1 id="tracker-heading" style={{ fontSize: 'var(--font-size-4xl)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 var(--spacing-4)' }}>
                Carbon Footprint <span style={{ color: 'var(--brand-primary)' }}>Tracker</span>
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)', maxWidth: '32rem', margin: '0 auto var(--spacing-8)' }}>
                Log your daily activities to calculate your carbon footprint and discover ways to reduce your environmental impact.
              </p>
              <Button variant="primary" size="lg" onClick={() => navigate('/signup')}>
                Get Started <ArrowRight size={20} aria-hidden="true" style={{ marginLeft: 'var(--spacing-2)' }} />
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="tracker-features-heading" style={{ padding: 'var(--spacing-16) 0', backgroundColor: 'var(--bg-primary)' }}>
          <div className="container">
            <h2 id="tracker-features-heading" style={{ textAlign: 'center', marginBottom: 'var(--spacing-12)' }}>What you can track</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)' }}>
              {[
                { icon: <Activity size={24} aria-hidden="true" />, title: 'Transportation', desc: 'Car, bus, train, flight, and more' },
                { icon: <Activity size={24} aria-hidden="true" />, title: 'Energy Usage', desc: 'Electricity, heating, and water' },
                { icon: <Activity size={24} aria-hidden="true" />, title: 'Diet & Food', desc: 'Meat, dairy, local, and seasonal' },
                { icon: <BarChart3 size={24} aria-hidden="true" />, title: 'Shopping', desc: 'Clothing, electronics, and goods' },
                { icon: <Target size={24} aria-hidden="true" />, title: 'Waste', desc: 'Recycling, composting, and landfill' },
                { icon: <BarChart3 size={24} aria-hidden="true" />, title: 'Lifestyle', desc: 'Entertainment, travel, and habits' }
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-gray-100)', transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--color-emerald-100)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-emerald-100)', color: 'var(--brand-primary)', marginBottom: 'var(--spacing-4)' }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-2)', color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="tracker-cta-heading" style={{ padding: 'var(--spacing-16) 0', backgroundColor: 'var(--bg-tertiary)', textAlign: 'center' }}>
          <div className="container">
            <h2 id="tracker-cta-heading" style={{ marginBottom: 'var(--spacing-4)' }}>Ready to make a difference?</h2>
            <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-secondary)', maxWidth: '32rem', margin: '0 auto var(--spacing-8)' }}>
              Sign up for free and start tracking your carbon footprint today.
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/signup')}>
              Create Free Account <ArrowRight size={20} aria-hidden="true" style={{ marginLeft: 'var(--spacing-2)' }} />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};
