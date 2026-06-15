import { memo } from 'react';
import { Terminal, ShieldCheck, Globe, Activity } from 'lucide-react';

const metrics = [
  { label: 'System Health', value: '100 / 100', icon: Activity, status: 'pass' },
  { label: 'Build Status', value: 'PASS', icon: ShieldCheck, status: 'pass' },
  { label: 'Environment', value: 'Production', icon: Globe, status: 'default' },
];

const MetricBadge = memo(({ label, value, icon: Icon, status }) => (
  <div className={`eng-hero__metric eng-hero__metric--${status}`}>
    <Icon className="eng-hero__metric-icon" aria-hidden="true" size={20} />
    <div className="eng-hero__metric-body">
      <span className="eng-hero__metric-label">{label}</span>
      <span className="eng-hero__metric-value">{value}</span>
    </div>
  </div>
));

MetricBadge.displayName = 'MetricBadge';

export const EngineeringHero = memo(() => (
  <section className="eng-hero">
    <div className="container">
      <div className="eng-hero__brand">
        <Terminal className="eng-hero__brand-icon" aria-hidden="true" size={28} />
        <div>
          <h1 className="eng-hero__title">Engineering Dashboard</h1>
          <p className="eng-hero__subtitle">Production Ready</p>
        </div>
      </div>
      <div className="eng-hero__metrics">
        {metrics.map((m) => (
          <MetricBadge key={m.label} {...m} />
        ))}
      </div>
    </div>
  </section>
));

EngineeringHero.displayName = 'EngineeringHero';
