import { memo } from 'react';

export const StatusCard = memo(({ icon: Icon, title, value, status, subtitle }) => (
  <article className="eng-card eng-card--gate">
    <div className="eng-card__header">
      <div className="eng-card__icon-wrapper">
        <Icon className="eng-card__icon" aria-hidden="true" size={20} />
      </div>
      <span className={`eng-card__badge eng-card__badge--${status.toLowerCase()}`}>
        {status}
      </span>
    </div>
    <h3 className="eng-card__title">{title}</h3>
    <p className="eng-card__value">{value}</p>
    <p className="eng-card__subtitle">{subtitle}</p>
  </article>
));

StatusCard.displayName = 'StatusCard';
