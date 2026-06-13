import { useEffect, useState } from 'react';
import { ActivityService } from '../../utils/activityService';

export const MostRecentActivity = () => {
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    const list = ActivityService.loadActivities();
    if (list && list.length > 0) setRecent(list[0]);
  }, []);

  if (!recent) {
    return (
      <div className="dfp-most-recent" role="region" aria-label="Most recent activity">
        <h3>Most Recent Activity</h3>
        <p className="dfp-placeholder">No recent activity</p>
      </div>
    );
  }

  const date = new Date(recent.date).toLocaleString();
  const status = recent.co2 <= 1 ? 'Low emission — great!' : (recent.co2 <= 10 ? 'Moderate emission' : 'High emission — consider alternatives');

  return (
    <div className="dfp-most-recent" role="region" aria-label="Most recent activity" aria-live="polite">
      <h3>Most Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div><strong>Activity:</strong> {recent.type}</div>
        <div><strong>Date:</strong> {date}</div>
        <div><strong>Input:</strong> {recent.value}</div>
        <div><strong>Estimated CO₂:</strong> {Number(recent.co2).toFixed(3)} kg</div>
        <div aria-live="polite" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{status}</div>
      </div>
    </div>
  );
};

export default MostRecentActivity;
