import { memo, useEffect, useState } from 'react';
import { ExportService } from '../../utils/exportService';
import { ActivityService } from '../../utils/activityService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';
import './print.css';

export const PrintableReport = () => {
  const [report, setReport] = useState(null);

  const refresh = () => {
    const activities = ActivityService.loadActivities();
    const data = ExportService.makeReportData(activities);
    setReport(data);
  };

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if ([STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.GOAL, STORAGE_KEYS.ACHIEVEMENTS].includes(e.key)) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!report) return null;

  return (
    <div id="eco-print-report" className="eco-print-report" aria-hidden>
      <header className="print-header">
        <h1>EcoTrack — Activity Report</h1>
        <div className="print-meta">Generated: {new Date(report.generatedAt).toLocaleString()}</div>
      </header>
      <section className="print-summary">
        <h2>Summary</h2>
        <dl>
          <dt>Carbon Score</dt><dd>{report.scoreObj.score} ({report.scoreObj.rating})</dd>
          <dt>Monthly Goal (kg)</dt><dd>{report.goal && report.goal.targetKg ? report.goal.targetKg : '—'}</dd>
          <dt>Current Progress (month)</dt><dd>{report.progress.current} kg ({report.progress.percent}%)</dd>
          <dt>Total CO₂</dt><dd>{report.totals.total} kg</dd>
          <dt>Monthly CO₂</dt><dd>{report.totals.monthly} kg</dd>
          <dt>Weekly CO₂</dt><dd>{report.totals.weekly} kg</dd>
          <dt>Today's CO₂</dt><dd>{report.totals.today} kg</dd>
          <dt>Highest Emission Category</dt><dd>{report.breakdown.list && report.breakdown.list.length>0?report.breakdown.list[0].type:'—'}</dd>
          <dt>Number of Activities</dt><dd>{report.recentActivities.length}</dd>
          <dt>Achievements Unlocked</dt><dd>{report.achievements.filter(a=>a.unlocked).length}</dd>
        </dl>
      </section>

      <section className="print-goal">
        <h2>Goal Status</h2>
        <p>{report.progress.status} — {report.progress.insight}</p>
      </section>

      <section className="print-achievements">
        <h2>Achievements</h2>
        <ul>
          {report.achievements.map(a => (
            <li key={a.id}>{a.icon} {a.title} — {a.unlocked ? `Unlocked ${a.unlockedDate}` : a.progress?.hint || a.description}</li>
          ))}
        </ul>
      </section>

      <section className="print-recommendations">
        <h2>Recommendations</h2>
        <ol>
          {report.recommendations.slice(0,5).map((r, i) => (
            <li key={i}><strong>{r.title}</strong>: {r.description} — Suggestion: {r.suggestion}</li>
          ))}
        </ol>
      </section>

      <section className="print-recent-activities">
        <h2>Recent Activities</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Value</th><th>CO₂ (kg)</th><th>Category</th></tr>
          </thead>
          <tbody>
            {report.recentActivities.map(a => (
              <tr key={a.id}><td>{new Date(a.date).toLocaleString()}</td><td>{a.type}</td><td>{a.value}</td><td>{a.co2}</td><td>{a.type}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default memo(PrintableReport);
