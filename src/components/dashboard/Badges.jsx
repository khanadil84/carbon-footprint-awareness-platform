import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityCache } from '../../utils/activityCache';
import { GoalService } from '../../utils/goalService';
import { STORAGE_KEYS } from '../../config/securityConfig.js';

const STORAGE_KEYS_LIST = [STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.GOAL, STORAGE_KEYS.ACHIEVEMENTS];

const BadgeCard = ({ achievement, isLocked }) => (
  <div key={achievement.id} className={`badge ${isLocked ? 'locked' : 'earned'}`} title={isLocked ? undefined : achievement.description} aria-label={isLocked ? `${achievement.title} locked` : `${achievement.title} unlocked. ${achievement.description}`}>
    {isLocked ? (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div className="badge-icon" aria-hidden>{achievement.icon}</div>
        <div>
          <div className="badge-title">{achievement.title}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{achievement.progress?.hint || achievement.description}</div>
        </div>
      </div>
    ) : (
      <>
        <div className="badge-icon" aria-hidden>{achievement.icon}</div>
        <div className="badge-title">{achievement.title}</div>
      </>
    )}
  </div>
);

export const Badges = () => {
  const [data, setData] = useState({ achievements: [], recent: null });

  const refresh = useCallback(() => {
    const goal = GoalService.loadGoal();
    setData(ActivityCache.getAchievements(goal));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onStorage = (e) => {
      if (STORAGE_KEYS_LIST.includes(e.key)) {
        ActivityCache.invalidate();
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const earned = data.achievements.filter(a => a.unlocked);
  const locked = data.achievements.filter(a => !a.unlocked);

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
                <BadgeCard key={a.id} achievement={a} isLocked={false} />
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
                <BadgeCard key={a.id} achievement={a} isLocked={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(Badges);
