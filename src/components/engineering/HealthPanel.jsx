import { memo } from 'react';
import { SYSTEM_HEALTH } from './engineeringData';

const statusIcon = (status) => {
  if (status === 'Healthy') return '●';
  if (status === 'Running') return '●';
  return '○';
};

const statusClass = (status) => {
  switch (status) {
    case 'Healthy': return 'eng-health__item--ok';
    case 'Running': return 'eng-health__item--running';
    default: return 'eng-health__item--warn';
  }
};

const HealthItem = memo(({ label, status }) => (
  <div className={`eng-health__item ${statusClass(status)}`}>
    <span className="eng-health__item-dot" aria-hidden="true">{statusIcon(status)}</span>
    <span className="eng-health__item-label">{label}</span>
    <span className="eng-health__item-status">{status}</span>
  </div>
));

HealthItem.displayName = 'HealthItem';

export const HealthPanel = memo(() => {
  const pct = (SYSTEM_HEALTH.score / SYSTEM_HEALTH.maxScore) * 100;

  return (
    <section className="eng-health">
      <div className="eng-health__score-card">
        <h3 className="eng-health__score-title">Health Score</h3>
        <div className="eng-health__score-value">
          {SYSTEM_HEALTH.score}<span className="eng-health__score-max"> / {SYSTEM_HEALTH.maxScore}</span>
        </div>
        <div className="eng-progress" role="progressbar" aria-valuenow={SYSTEM_HEALTH.score}
             aria-valuemin={0} aria-valuemax={SYSTEM_HEALTH.maxScore} aria-label="System health score">
          <div className="eng-progress__bar" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="eng-health__items">
        {SYSTEM_HEALTH.items.map((item) => (
          <HealthItem key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
});

HealthPanel.displayName = 'HealthPanel';
