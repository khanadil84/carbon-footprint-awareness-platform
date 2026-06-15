import { memo } from 'react';
import { Terminal, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EngineeringHero } from '../components/engineering/EngineeringHero';
import { StatusCard } from '../components/engineering/StatusCard';
import { MetricsCard } from '../components/engineering/MetricsCard';
import { HealthPanel } from '../components/engineering/HealthPanel';
import { BuildInfo } from '../components/engineering/BuildInfo';
import { RecentEvents } from '../components/engineering/RecentEvents';
import { QUALITY_GATES, PERFORMANCE_METRICS } from '../components/engineering/engineeringData';
import '../components/engineering/engineering.css';

const Section = memo(({ title, children }) => (
  <section className="eng-section">
    <div className="eng-section__header">
      <div className="eng-section__accent" aria-hidden="true" />
      <h2 className="eng-section__title">{title}</h2>
    </div>
    {children}
  </section>
));

Section.displayName = 'Section';

export const EngineeringPage = memo(() => (
  <div className="eng-page">
    <header className="eng-topbar">
      <div className="eng-topbar__brand">
        <Terminal className="eng-topbar__brand-icon" aria-hidden="true" size={20} />
        <span>EcoTrack</span>
        <span className="eng-topbar__separator" aria-hidden="true">/</span>
        <span className="eng-topbar__page">Engineering</span>
      </div>
      <Link to="/" className="eng-topbar__back">
        <ArrowLeft size={14} aria-hidden="true" style={{ marginRight: 4, verticalAlign: 'middle' }} />
        <span className="eng-topbar__back-text">Back to site</span>
      </Link>
    </header>

    <EngineeringHero />

    <Section title="Quality Gates">
      <div className="eng-grid eng-grid--gates">
        {QUALITY_GATES.map((gate, i) => (
          <div key={gate.id} className="eng-grid__item" style={{ animationDelay: `${i * 0.04}s` }}>
            <StatusCard {...gate} />
          </div>
        ))}
      </div>
    </Section>

    <Section title="Performance">
      <div className="eng-grid eng-grid--metrics">
        {PERFORMANCE_METRICS.map((metric, i) => (
          <div key={metric.id} className="eng-grid__item" style={{ animationDelay: `${i * 0.04}s` }}>
            <MetricsCard {...metric} />
          </div>
        ))}
      </div>
    </Section>

    <Section title="System Health">
      <HealthPanel />
    </Section>

    <Section title="Build Information">
      <BuildInfo />
    </Section>

    <Section title="Recent Engineering Events">
      <RecentEvents />
    </Section>
  </div>
));

EngineeringPage.displayName = 'EngineeringPage';
