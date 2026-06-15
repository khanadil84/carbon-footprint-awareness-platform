import { memo } from 'react';

export const MetricsCard = memo(({ icon: Icon, title, value, subtitle }) => (
  <article className="eng-card eng-card--metric">
    <div className="eng-card__icon-wrapper">
      <Icon className="eng-card__icon" aria-hidden="true" size={18} />
    </div>
    <h3 className="eng-card__title">{title}</h3>
    <p className="eng-card__value eng-card__value--large">{value}</p>
    {subtitle && <p className="eng-card__subtitle">{subtitle}</p>}
  </article>
));

MetricsCard.displayName = 'MetricsCard';
