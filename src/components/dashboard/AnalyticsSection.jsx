import { memo, useMemo } from 'react';
import { computeFullAggregation, aggregateByDay, aggregateByWeek, aggregateByMonth, breakdownByCategory, summaryStats } from '../../utils/activityAnalytics';
import { ActivityCache } from '../../utils/activityCache';
import { StatCard } from './StatCard';
import { LineChart, SimpleBar } from '../ui/Chart';
import './analytics.css';

const chartOrder = { daily: 0, weekly: 1, monthly: 2 };

const ChartCard = ({ title, data, ariaLabel }) => (
  <div className="analytics-card">
    <h3>{title}</h3>
    <LineChart data={data} ariaLabel={ariaLabel} />
  </div>
);

const BreakdownSection = ({ breakdown }) => (
  <div className="breakdown">
    <h3>Activity Breakdown</h3>
    {breakdown.list.length === 0 ? (
      <p className="dfp-placeholder">No data to display.</p>
    ) : (
      <div role="list" aria-label="Activity breakdown by category">
          {breakdown.list.map(entry => (
            <SimpleBar key={entry.type} pct={entry.pct} label={`${entry.type} (${entry.value} kg)`} />
          ))}
      </div>
    )}
  </div>
);

const SummarySection = ({ summary }) => (
  <div className="analytics-summary" aria-label="Summary statistics" role="region">
    <h3>Summary</h3>
    <div className="summary-grid">
      <StatCard title="Highest Category" value={summary.highestEmissionCategory || '\u2014'} ariaLabel="Highest emission category" />
      <StatCard title="Total Activities" value={summary.totalActivities} ariaLabel="Total activities" />
      <StatCard title="Avg Daily CO\u2082" value={summary.avgDaily} unit="kg" ariaLabel="Average daily CO2" />
      <StatCard title="Best Day" value={summary.bestDay ? `${summary.bestDay.date} (${summary.bestDay.value} kg)` : '\u2014'} ariaLabel="Best day" />
    </div>
  </div>
);

export const AnalyticsSection = ({ activitiesProp, preferredRange }) => {
  const activities = activitiesProp || ActivityCache.getActivities();

  const fullAggregation = useMemo(() => computeFullAggregation(activities), [activities]);

  const chartData = useMemo(() => {
    const daily = aggregateByDay(activities, 30, fullAggregation.dayMap);
    const weekly = aggregateByWeek(activities, 12);
    const monthly = aggregateByMonth(activities, 12, fullAggregation.monthMap);
    return { daily, weekly, monthly };
  }, [activities, fullAggregation]);

  const breakdown = useMemo(() => breakdownByCategory(activities, fullAggregation), [activities, fullAggregation]);
  const summary = useMemo(() => summaryStats(activities, fullAggregation), [activities, fullAggregation]);

  const charts = useMemo(() => {
    const keys = ['daily', 'weekly', 'monthly'];
    const sortedKeys = [...keys].sort((a, b) => {
      if (a === preferredRange) return -1;
      if (b === preferredRange) return 1;
      return chartOrder[a] - chartOrder[b];
    });

    return sortedKeys.map(key => ({
      key,
      title: key === 'daily' ? 'Daily CO\u2082 (30d)' : key === 'weekly' ? 'Weekly CO\u2082 (12w)' : 'Monthly CO\u2082 (12m)',
      data: key === 'daily' ? chartData.daily : key === 'weekly'
        ? chartData.weekly.map(entry => ({ date: entry.label, value: entry.value }))
        : chartData.monthly.map(entry => ({ date: entry.label, value: entry.value })),
      ariaLabel: key === 'daily' ? 'Daily CO2 trend' : key === 'weekly' ? 'Weekly CO2 trend' : 'Monthly CO2 trend'
    }));
  }, [chartData, preferredRange]);

  return (
    <section className="dfp-analytics" aria-labelledby="dfp-analytics-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-analytics-heading">Analytics</h2>
      </div>
      <div className="dfp-section__content">
        <div className="analytics-grid">
          {charts.map(chart => (
            <ChartCard key={chart.key} title={chart.title} data={chart.data} ariaLabel={chart.ariaLabel} />
          ))}
        </div>

        <div style={{ height: '1rem' }} />

        <div className="analytics-bottom">
          <BreakdownSection breakdown={breakdown} />
          <SummarySection summary={summary} />
        </div>
      </div>
    </section>
  );
};

export default memo(AnalyticsSection);
