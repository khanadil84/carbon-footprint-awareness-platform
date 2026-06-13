import { memo, useEffect, useState } from 'react';
import { ActivityForm } from './ActivityForm';
import { ActivityService } from '../../utils/activityService';
import { Button } from '../ui/Button';

export const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    setActivities(ActivityService.loadActivities());
  }, []);

  const handleAdd = (activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const handleDelete = (id) => {
    const next = ActivityService.removeActivity(id);
    setActivities(next);
  };

  return (
    <section className="dfp-recent" aria-labelledby="dfp-recent-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-recent-heading">Recent Activity</h2>
      </div>
      <div className="dfp-section__content">
        <ActivityForm onAdd={handleAdd} />

        {activities.length === 0 ? (
          <p className="dfp-placeholder" style={{ marginTop: '1rem' }}>No recent activity to display. Add an activity to get started.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="dfp-activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Activity</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Input</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Estimated CO₂ (kg)</th>
                  <th style={{ padding: '8px' }} aria-hidden>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px' }}>{new Date(a.date).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>{a.type}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{a.value}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{Number(a.co2).toFixed(3)}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <Button variant="ghost" onClick={() => handleDelete(a.id)} aria-label={`Delete activity ${a.type}`}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(RecentActivity);
