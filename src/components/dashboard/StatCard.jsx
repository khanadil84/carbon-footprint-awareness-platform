import React from 'react';

export const StatCard = ({ title, value, unit, description, ariaLabel }) => {
  return (
    <div className="dfp-stat-card" role="group" aria-label={ariaLabel || title}>
      <div className="dfp-stat-card__value" aria-hidden="true">
        {value}
        {unit && <span className="dfp-stat-card__unit">{unit}</span>}
      </div>
      <div className="dfp-stat-card__title">{title}</div>
      {description && <div className="dfp-stat-card__desc">{description}</div>}
    </div>
  );
};

export default StatCard;
