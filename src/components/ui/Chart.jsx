import React from 'react';

export const LineChart = ({ data = [], color = 'var(--brand-primary)', ariaLabel }) => {
  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={ariaLabel} className="ecochart-line">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
};

export const SimpleBar = ({ pct = 0, color = 'var(--brand-primary)', label }) => (
  <div className="bar-row">
    <div className="bar-label">{label}</div>
    <div className="bar-track" aria-hidden>
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
    <div className="bar-pct">{pct}%</div>
  </div>
);

export default { LineChart, SimpleBar };
