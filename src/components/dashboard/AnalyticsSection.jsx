import React from 'react';
import { aggregateByDay, aggregateByWeek, aggregateByMonth, breakdownByCategory, summaryStats } from '../../utils/activityAnalytics';
import { activityService } from '../../utils/activityService';
import { StatCard } from './StatCard';
import { LineChart, SimpleBar } from '../ui/Chart';
import './analytics.css';

export const AnalyticsSection = ({ activitiesProp }) => {
  const activities = activitiesProp || activityService.loadActivities();

  const daily = aggregateByDay(activities, 30);
  const weekly = aggregateByWeek(activities, 12);
  const monthly = aggregateByMonth(activities, 12);
  const breakdown = breakdownByCategory(activities);
  const summary = summaryStats(activities);

  return (
    <section className="dfp-analytics" aria-labelledby="dfp-analytics-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-analytics-heading">Analytics</h2>
      </div>
      <div className="dfp-section__content">
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Daily CO₂ (30d)</h3>
            <LineChart data={daily} ariaLabel="Daily CO2 trend" />
          </div>

          <div className="analytics-card">
            <h3>Weekly CO₂ (12w)</h3>
            <LineChart data={weekly.map((d,i)=>({date:d.label,value:d.value}))} ariaLabel="Weekly CO2 trend" />
          </div>

          <div className="analytics-card">
            <h3>Monthly CO₂ (12m)</h3>
            <LineChart data={monthly.map((d,i)=>({date:d.label,value:d.value}))} ariaLabel="Monthly CO2 trend" />
          </div>
        </div>

        <div style={{ height: '1rem' }} />

        <div className="analytics-bottom">
          <div className="breakdown">
            <h3>Activity Breakdown</h3>
            {breakdown.list.length === 0 ? (
              <p className="dfp-placeholder">No data to display.</p>
            ) : (
              breakdown.list.map(b => (
                <SimpleBar key={b.type} pct={b.pct} label={`${b.type} (${b.value} kg)`} />
              ))
            )}
          </div>

          <div className="analytics-summary">
            <h3>Summary</h3>
            <div className="summary-grid">
              <StatCard title="Highest Category" value={summary.highestEmissionCategory || '—'} ariaLabel="Highest emission category" />
              <StatCard title="Total Activities" value={summary.totalActivities} ariaLabel="Total activities" />
              <StatCard title="Avg Daily CO₂" value={summary.avgDaily} unit="kg" ariaLabel="Average daily CO2" />
              <StatCard title="Best Day" value={summary.bestDay ? `${summary.bestDay.date} (${summary.bestDay.value} kg)` : '—'} ariaLabel="Best day" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSection;
