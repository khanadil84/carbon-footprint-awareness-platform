import { memo, useMemo } from 'react';

const LineChartComponent = ({ data = [], color = 'var(--brand-primary)', ariaLabel }) => {
  const max = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const points = useMemo(() => data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(' '), [data, max]);

  const dataSummary = useMemo(() => {
    if (!data || data.length === 0) return 'No data';
    const vals = data.map(d => d.value);
    return `${data.length} data points. Range: ${Math.min(...vals).toFixed(2)} to ${Math.max(...vals).toFixed(2)} kg. Values: ${vals.map((v, i) => `${i + 1}: ${v.toFixed(2)} kg`).join(', ')}`;
  }, [data]);

  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;
  return (
    <>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={ariaLabel} aria-roledescription="line chart" className="ecochart-line">
        <title>{ariaLabel}</title>
        <desc>{dataSummary}</desc>
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      </svg>
      <span className="sr-only">{dataSummary}</span>
    </>
  );
};

export const LineChart = memo(LineChartComponent);

export const SimpleBar = memo(({ pct = 0, color = 'var(--brand-primary)', label }) => (
  <div className="bar-row">
    <div className="bar-label">{label}</div>
    <div className="bar-track" aria-hidden>
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
    <div className="bar-pct">{pct}%</div>
  </div>
));


