import { memo, useEffect, useState } from 'react';
import { ActivityCache } from '../../utils/activityCache';
import { GoalService } from '../../utils/goalService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';

export const Badges = () => {
  const [data, setData] = useState({ achievements: [], recent: null });

  const refresh = () => {
    const goal = GoalService.loadGoal();
    const res = ActivityCache.getAchievements(goal);
    setData(res);
  };

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if ([STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.GOAL, STORAGE_KEYS.ACHIEVEMENTS].includes(e.key)) {
        ActivityCache.invalidate();
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const earned = [];
  const locked = [];
  for (let i = 0; i < data.achievements.length; i++) {
    const a = data.achievements[i];
    (a.unlocked ? earned : locked).push(a);
  }

  return (
    <section className="dfp-badges" aria-labelledby="dfp-badges-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-badges-heading">Achievements</h2>
      </div>
      <div className="dfp-section__content">
        {earned.length === 0 ? (
          <p className="dfp-placeholder">No badges earned yet. Complete activities and goals to unlock badges.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {earned.map(a => (
                <div key={a.id} className="badge earned" title={a.description} aria-label={`${a.title} unlocked. ${a.description}`}>
                  <div className="badge-icon" aria-hidden>{a.icon}</div>
                  <div className="badge-title">{a.title}</div>
                </div>
              ))}
            </div>
            {data.recent && (
              <div style={{ marginTop: '0.75rem' }} role="status" aria-live="polite">
                <strong>Recently unlocked:</strong> {data.recent.title} <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{new Date(data.recent.unlockedDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {locked.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Locked badges</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {locked.map(a => (
                <div key={a.id} className="badge locked" aria-label={`${a.title} locked`}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="badge-icon" aria-hidden>{a.icon}</div>
                    <div>
                      <div className="badge-title">{a.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.progress?.hint || a.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(Badges);
