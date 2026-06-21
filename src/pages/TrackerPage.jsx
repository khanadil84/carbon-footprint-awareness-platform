import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { InfoCard } from '../components/ui/InfoCard';
import { PageHero } from '../components/ui/PageHero';
import { Button } from '../components/ui/Button';
import { ArrowRight, Activity, BarChart3, Target } from 'lucide-react';

export const TrackerPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main id="main-content">
        <PageHero
          badgeText="Start your journey"
          headingId="tracker-heading"
          headingBefore="Carbon Footprint "
          headingHighlight="Tracker"
          description="Log your daily activities to calculate your carbon footprint and discover ways to reduce your environmental impact."
        >
          <div style={{ textAlign: 'center' }}>
            <Button variant="primary" size="lg" onClick={() => navigate('/signup')}>
              Get Started <ArrowRight size={20} aria-hidden="true" style={{ marginLeft: 'var(--spacing-2)' }} />
            </Button>
          </div>
        </PageHero>

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
                <InfoCard key={i} icon={item.icon} title={item.title} description={item.desc} />
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
