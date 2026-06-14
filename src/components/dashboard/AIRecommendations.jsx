import { memo, useEffect, useState } from 'react';
import { ActivityCache } from '../../utils/activityCache';
import { STORAGE_KEYS } from '../../config/securityConfig.js';

export const AIRecommendations = () => {
  const [recs, setRecs] = useState([]);

  const refresh = () => {
    const list = ActivityCache.getRecommendations();
    setRecs(list);
  };

  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.ACTIVITIES) {
        ActivityCache.invalidate();
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <section className="dfp-ai" aria-labelledby="dfp-ai-heading">
      <div className="dfp-section__header">
        <h2 id="dfp-ai-heading">Recommendations</h2>
      </div>
      <div className="dfp-section__content">
        {recs.length === 0 ? (
          <p className="dfp-placeholder">No recommendations at the moment.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recs.map((r, i) => (
              <li key={i} style={{ marginBottom: '0.75rem', padding: '0.5rem', border: '1px solid var(--color-gray-200)', borderRadius: '8px', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong>{r.title}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.priority}</span>
                </div>
                <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{r.description}</div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{r.estimatedSavingsKg} kg</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{r.suggestion}</div>
                </div>
                {r.encouragement && <div style={{ marginTop: '0.5rem', color: 'var(--brand-secondary)' }}>{r.encouragement}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default memo(AIRecommendations);
